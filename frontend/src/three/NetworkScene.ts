import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { InventoryPosition, LocationSummary, TransferPipelineRow } from "../types";

export interface HoverInfo {
  title: string;
  lines: string[];
  x: number;
  y: number;
}

export interface SceneOptions {
  showReorder: boolean;
  showTransfers: boolean;
  focusLocationId: number | null;
}

export interface SceneData {
  locations: LocationSummary[];
  inventory: InventoryPosition[];
  transfers: TransferPipelineRow[];
}

interface Handlers {
  onHover: (info: HoverInfo | null) => void;
  onSelectLocation: (id: number | null) => void;
}

const COLORS = {
  background: 0xf6f3ee,
  ground: 0xf1ece4,
  grid: 0xe2dacd,
  dc: 0xd8cbb9,
  store: 0xe9e0d3,
  edge: 0x5b3d2e,
  ok: 0x4f8f63,
  low: 0xd9962b,
  out: 0xc9472d,
  reorder: 0x5b3d2e,
  inTransit: 0xd9962b,
  onTime: 0x4f8f63,
  late: 0xc9472d,
  cancelled: 0xa89f94,
};

const MAX_COLUMNS_PER_LOCATION = 36;
const COLUMN_SIZE = 0.42;
const MAX_COLUMN_HEIGHT = 3.4;
const PLATFORM_HEIGHT = 0.4;

type PickData = { kind: "location" | "stock" | "transfer"; payload: unknown };
type Pickable = THREE.Mesh;
const pickData = (p: Pickable) => p.userData as PickData;

function statusColor(status: InventoryPosition["stock_status"]) {
  if (status === "OUT_OF_STOCK") return COLORS.out;
  if (status === "LOW_STOCK") return COLORS.low;
  return COLORS.ok;
}

function transferColor(row: TransferPipelineRow) {
  if (row.status === "IN_TRANSIT") return COLORS.inTransit;
  if (row.status === "CANCELLED") return COLORS.cancelled;
  if (row.delivery_check === "Arrived late") return COLORS.late;
  return COLORS.onTime;
}

function makeLabel(title: string, subtitle?: string, scale = 1): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const w = 512;
  const h = subtitle ? 160 : 110;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  // pill background
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "rgba(91,61,46,0.25)";
  ctx.lineWidth = 3;
  const r = 28;
  ctx.beginPath();
  ctx.roundRect(6, 6, w - 12, h - 12, r);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1f1a16";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 44px Inter, 'Segoe UI', sans-serif";
  ctx.fillText(title, w / 2, subtitle ? 58 : h / 2);
  if (subtitle) {
    ctx.fillStyle = "#7a6f66";
    ctx.font = "400 32px Inter, 'Segoe UI', sans-serif";
    ctx.fillText(subtitle, w / 2, 112);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set((w / 100) * scale, (h / 100) * scale, 1);
  sprite.renderOrder = 5;
  return sprite;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (material) {
      for (const m of Array.isArray(material) ? material : [material]) {
        for (const value of Object.values(m)) {
          if ((value as THREE.Texture)?.isTexture) (value as THREE.Texture).dispose();
        }
        m.dispose();
      }
    }
  });
}

/**
 * Warehouse network view: every location is a platform, every stock position a
 * column whose height is on-hand quantity, with a marker at the reorder point.
 * Transfers are arcs between locations; in-transit ones carry a moving crate.
 */
export class NetworkScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private timer = new THREE.Timer();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private resizeObserver: ResizeObserver;

  private world = new THREE.Group(); // everything data-driven lives here
  private pickables: Pickable[] = [];
  private movers: { mesh: THREE.Object3D; curve: THREE.Curve<THREE.Vector3>; offset: number }[] = [];
  private locationGroups = new Map<number, THREE.Group>();
  private locationAnchors = new Map<string, THREE.Vector3>(); // by name, for transfers
  private hovered: Pickable | null = null;
  private pointerDown: { x: number; y: number } | null = null;
  private desiredTarget = new THREE.Vector3(0, 0, 0);

  private data: SceneData | null = null;
  private options: SceneOptions = { showReorder: true, showTransfers: true, focusLocationId: null };

  constructor(
    private container: HTMLElement,
    private handlers: Handlers,
  ) {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.fog = new THREE.Fog(COLORS.background, 55, 140);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 400);
    this.camera.position.set(0, 27, 42);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 100;
    this.controls.zoomToCursor = true;
    this.controls.target.set(0, 0.5, 0);

    // lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0xcdbda8, 1.1);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(14, 24, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -32;
    sun.shadow.camera.right = 32;
    sun.shadow.camera.top = 32;
    sun.shadow.camera.bottom = -32;
    sun.shadow.camera.far = 80;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // ground + grid
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(120, 60, COLORS.grid, COLORS.grid);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.6;
    this.scene.add(grid);

    this.scene.add(this.world);

    this.timer.connect(document);
    this.renderer.setAnimationLoop(this.animate);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    const el = this.renderer.domElement;
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointerleave", this.onPointerLeave);
  }

  setData(data: SceneData) {
    this.data = data;
    this.rebuild();
  }

  setOptions(options: SceneOptions) {
    const focusChanged = options.focusLocationId !== this.options.focusLocationId;
    const needsRebuild =
      options.showReorder !== this.options.showReorder || options.showTransfers !== this.options.showTransfers;
    this.options = options;
    if (needsRebuild) this.rebuild();
    else this.applyFocus();
    if (focusChanged) this.retarget();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointerleave", this.onPointerLeave);
    this.controls.dispose();
    this.timer.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (el.parentElement === this.container) this.container.removeChild(el);
  }

  // ---------------------------------------------------------------- build

  private clearWorld() {
    disposeObject(this.world);
    this.world.clear();
    this.pickables = [];
    this.movers = [];
    this.locationGroups.clear();
    this.locationAnchors.clear();
    this.hovered = null;
  }

  private rebuild() {
    this.clearWorld();
    if (!this.data) return;
    const { locations, inventory, transfers } = this.data;

    const dcs = locations.filter((l) => l.location_type === "DC");
    const stores = locations.filter((l) => l.location_type !== "DC");
    const layout = new Map<number, { x: number; z: number; w: number; d: number }>();
    dcs.forEach((l, i) => layout.set(l.location_id, { x: (i - (dcs.length - 1) / 2) * 10.5, z: -6.5, w: 8, d: 5 }));
    stores.forEach((l, i) => layout.set(l.location_id, { x: (i - (stores.length - 1) / 2) * 7.5, z: 6.5, w: 5.5, d: 4 }));

    for (const loc of locations) {
      const slot = layout.get(loc.location_id)!;
      const group = new THREE.Group();
      group.position.set(slot.x, 0, slot.z);
      this.world.add(group);
      this.locationGroups.set(loc.location_id, group);
      this.locationAnchors.set(loc.name, new THREE.Vector3(slot.x, PLATFORM_HEIGHT + 0.6, slot.z));

      // platform
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(slot.w, PLATFORM_HEIGHT, slot.d),
        new THREE.MeshStandardMaterial({ color: loc.location_type === "DC" ? COLORS.dc : COLORS.store, roughness: 0.9 }),
      );
      platform.position.y = PLATFORM_HEIGHT / 2;
      platform.receiveShadow = true;
      platform.castShadow = true;
      platform.userData = { kind: "location", payload: loc };
      group.add(platform);
      this.pickables.push(platform);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(platform.geometry),
        new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.35 }),
      );
      edge.position.copy(platform.position);
      group.add(edge);

      // label
      const label = makeLabel(loc.name, `${loc.location_type} · ${loc.skus_stocked} SKUs`, 0.9);
      label.position.set(0, MAX_COLUMN_HEIGHT + 1.9, 0);
      group.add(label);

      // stock columns
      const rows = inventory
        .filter((r) => r.location_id === loc.location_id)
        .sort((a, b) => b.value_at_cost - a.value_at_cost)
        .slice(0, MAX_COLUMNS_PER_LOCATION);
      if (rows.length === 0) continue;
      const ref = Math.max(...rows.map((r) => Math.max(r.quantity_on_hand, r.reorder_point * 1.5)), 1);
      const cols = Math.max(1, Math.ceil(Math.sqrt(rows.length * (slot.w / slot.d))));
      const rowsCount = Math.ceil(rows.length / cols);
      const cellX = (slot.w - 0.8) / cols;
      const cellZ = (slot.d - 0.8) / rowsCount;
      const columnGeometry = new THREE.BoxGeometry(COLUMN_SIZE, 1, COLUMN_SIZE);
      const markerGeometry = new THREE.BoxGeometry(COLUMN_SIZE + 0.22, 0.04, COLUMN_SIZE + 0.22);
      const markerMaterial = new THREE.MeshStandardMaterial({ color: COLORS.reorder, roughness: 0.6, transparent: true, opacity: 0.85 });

      rows.forEach((row, i) => {
        const cx = -slot.w / 2 + 0.4 + cellX * ((i % cols) + 0.5);
        const cz = -slot.d / 2 + 0.4 + cellZ * (Math.floor(i / cols) + 0.5);
        const h = Math.max(0.08, MAX_COLUMN_HEIGHT * Math.min(row.quantity_on_hand / ref, 1));
        const column = new THREE.Mesh(
          columnGeometry,
          new THREE.MeshStandardMaterial({ color: statusColor(row.stock_status), roughness: 0.55, metalness: 0.05 }),
        );
        column.scale.y = h;
        column.position.set(cx, PLATFORM_HEIGHT + h / 2, cz);
        column.castShadow = true;
        column.receiveShadow = true;
        column.userData = { kind: "stock", payload: row };
        group.add(column);
        this.pickables.push(column);

        if (this.options.showReorder && row.reorder_point > 0) {
          const my = PLATFORM_HEIGHT + MAX_COLUMN_HEIGHT * Math.min(row.reorder_point / ref, 1);
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(cx, my, cz);
          group.add(marker);
        }
      });
    }

    // transfers
    if (this.options.showTransfers) {
      transfers.forEach((t, i) => {
        const from = this.locationAnchors.get(t.from_location);
        const to = this.locationAnchors.get(t.to_location);
        if (!from || !to) return;
        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.y = 5 + from.distanceTo(to) * 0.22 + i * 0.35;
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const color = transferColor(t);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 48, t.status === "IN_TRANSIT" ? 0.09 : 0.05, 10),
          new THREE.MeshStandardMaterial({ color, roughness: 0.5, transparent: true, opacity: t.status === "IN_TRANSIT" ? 0.95 : 0.55 }),
        );
        tube.userData = { kind: "transfer", payload: t };
        this.world.add(tube);
        this.pickables.push(tube);

        if (t.status === "IN_TRANSIT") {
          const crate = new THREE.Group();
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.45, 0.45),
            new THREE.MeshStandardMaterial({ color: COLORS.edge, roughness: 0.4 }),
          );
          body.castShadow = true;
          crate.add(body);
          const tag = makeLabel(t.carrier ?? "Carrier", t.tracking_number ?? undefined, 0.42);
          tag.position.y = 1.1;
          crate.add(tag);
          this.world.add(crate);
          this.movers.push({ mesh: crate, curve, offset: i * 0.3 });
        }
      });
    }

    this.applyFocus();
  }

  private applyFocus() {
    const focus = this.options.focusLocationId;
    for (const [id, group] of this.locationGroups) {
      const dim = focus !== null && id !== focus;
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        const material = mesh.material as THREE.Material | undefined;
        if (!material || obj instanceof THREE.Sprite) return;
        if (material instanceof THREE.LineBasicMaterial) return;
        const base = material.userData.baseOpacity ?? (material.transparent ? material.opacity : 1);
        material.userData.baseOpacity = base;
        material.transparent = dim || base < 1;
        material.opacity = dim ? Math.min(base, 0.22) : base;
        material.depthWrite = !dim;
        material.needsUpdate = true;
      });
    }
  }

  private retarget() {
    const focus = this.options.focusLocationId;
    const group = focus === null ? null : this.locationGroups.get(focus);
    if (group) this.desiredTarget.set(group.position.x, 1, group.position.z);
    else this.desiredTarget.set(0, 0.5, 0);
  }

  // ---------------------------------------------------------------- loop

  private animate = () => {
    this.timer.update();
    const delta = this.timer.getDelta();
    const elapsed = this.timer.getElapsed();

    for (const mover of this.movers) {
      const t = (elapsed * 0.09 + mover.offset) % 1;
      const pos = mover.curve.getPointAt(t);
      const ahead = mover.curve.getPointAt(Math.min(t + 0.01, 1));
      mover.mesh.position.copy(pos);
      mover.mesh.lookAt(ahead);
    }

    this.controls.target.lerp(this.desiredTarget, Math.min(1, delta * 4));
    this.controls.update(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ---------------------------------------------------------------- picking

  private setPointer(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private pick(): Pickable | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    return (hit?.object as Pickable | undefined) ?? null;
  }

  private setHovered(next: Pickable | null) {
    if (this.hovered === next) return;
    const restore = (p: Pickable, on: boolean) => {
      const m = p.material as THREE.MeshStandardMaterial;
      if (m.emissive) m.emissive.setHex(on ? 0x332015 : 0x000000);
    };
    if (this.hovered) restore(this.hovered, false);
    this.hovered = next;
    if (next) restore(next, true);
    this.renderer.domElement.style.cursor = next ? "pointer" : "grab";
  }

  private describe(p: Pickable): Omit<HoverInfo, "x" | "y"> {
    if (pickData(p).kind === "stock") {
      const r = pickData(p).payload as InventoryPosition;
      return {
        title: r.product,
        lines: [
          `${r.location} · ${r.sku}`,
          `On hand ${r.quantity_on_hand} ${r.unit} · Min ${r.reorder_point}`,
          `Value at cost $${r.value_at_cost.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
          r.stock_status.replace("_", " ").toLowerCase(),
        ],
      };
    }
    if (pickData(p).kind === "location") {
      const l = pickData(p).payload as LocationSummary;
      return {
        title: l.name,
        lines: [
          `${l.location_type} · ${l.city ?? ""} ${l.state ?? ""}`.trim(),
          `${l.skus_stocked} SKUs · ${Math.round(l.units_on_hand).toLocaleString()} units`,
          `${l.low_stock} low · ${l.out_of_stock} out of stock`,
          "Click to focus",
        ],
      };
    }
    const t = pickData(p).payload as TransferPipelineRow;
    return {
      title: `${t.from_location} → ${t.to_location}`,
      lines: [
        `${t.status.replace("_", " ")} · ${t.carrier ?? "no carrier"}`,
        `${t.lines_fully_received}/${t.product_lines} lines received`,
        `Value shipped $${t.value_shipped.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
        t.delivery_check,
      ],
    };
  }

  private onPointerMove = (event: PointerEvent) => {
    const { x, y } = this.setPointer(event);
    const hit = this.pick();
    this.setHovered(hit);
    this.handlers.onHover(hit ? { ...this.describe(hit), x, y } : null);
  };

  private onPointerDown = (event: PointerEvent) => {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent) => {
    const start = this.pointerDown;
    this.pointerDown = null;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return; // it was a drag
    this.setPointer(event);
    const hit = this.pick();
    if (!hit) {
      this.handlers.onSelectLocation(null);
      return;
    }
    if (pickData(hit).kind === "location") {
      const loc = pickData(hit).payload as LocationSummary;
      this.handlers.onSelectLocation(this.options.focusLocationId === loc.location_id ? null : loc.location_id);
    } else if (pickData(hit).kind === "stock") {
      const row = pickData(hit).payload as InventoryPosition;
      this.handlers.onSelectLocation(row.location_id);
    }
  };

  private onPointerLeave = () => {
    this.setHovered(null);
    this.handlers.onHover(null);
  };
}
