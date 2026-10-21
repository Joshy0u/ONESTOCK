import pymysql

def mysqlconnect():
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='myDB',
        database='onestock',
    )

    cur = conn.cursor()
    cur.execute("select @@version")
    output = cur.fetchall()
    print(output)

    #close con
    conn.close()

if __name__ == "__main__":
    mysqlconnect()