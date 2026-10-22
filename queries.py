import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def mysqlconnect():
    conn = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),

    )

    cur = conn.cursor()

    cur.execute("select * from carrier;")
    output = cur.fetchall()

    for i in output:
        print(i)

    cur = conn.close()

if __name__ == "__main__":
    mysqlconnect()