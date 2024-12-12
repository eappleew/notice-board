from flask import Flask,redirect,render_template
from flask import request

import random
import pymysql,datetime

app = Flask(__name__)

db = pymysql.connect(host='localhost',user='root',password='1234',charset='utf8')
cursor = db.cursor(pymysql.cursors.DictCursor)
cursor.execute('USE programming;')
cursor.execute('SELECT * FROM crud_information;')
value = cursor.fetchall()
info = value

def get_info(): 
    cursor.execute('SELECT * FROM crud_information;')
    return cursor.fetchall()


def add():
    info = get_info()
    add_info=''
    for i in info:
        add_info += f"<h2><a href='/read/{i['id']}/'>{i['id']}-{i['title']}</a></h2><br>"
    return add_info

@app.route('/')
def main():
    return render_template('index.html',add_info=add())

@app.route('/read/<int:id>/') #읽기 기능
def readpage(id):
    info = get_info()
    for i in info:
        if id == i['id']:
            return render_template('read.html',title=i['title'],description=i['description'],id=i['id'])


@app.route('/create/',methods=['GET','POST']) #생성 기능
def create():
    if request.method == 'GET':
        return render_template('create.html')
    elif request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        cursor.execute(f'INSERT INTO crud_information (title, description) VALUES (%s, %s)',(title, description))
        db.commit()
        return redirect('/')


@app.route('/delete/<int:id>/') #삭제 기능
def delete(id):
    cursor.execute(f'DELETE FROM crud_information WHERE id = {id};')
    db.commit()
    return redirect('/')


@app.route('/update/<int:id>/',methods=['GET','POST']) #수정 기능
def update(id):
    info = get_info()
    for i in info:
        if id == i['id']:
            title = i['title']
            description = i['description']
    if request.method == 'GET':
        return render_template('update.html',id=id,title=title,description=description)
    elif request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        cursor.execute(f'UPDATE crud_information SET title="{title}",description="{description}" WHERE id="{id}";')
        db.commit()
        return redirect('/')


@app.route('/allsearch/',methods=['POST','GET'])
def allsearch():
    sobject = request.form['object']
    cursor.execute('SELECT title,id,description FROM crud_information')
    info = cursor.fetchall()
    value = ""
    for i in info:
        if sobject in i['title'] or sobject in i['description']:
            value += f"<h2><a href='/read/{i['id']}/'>{i['id']}-{i['title']}</a></h2><br>"
    return render_template('search.html',add_info=value)


@app.route('/titlesearch/',methods=['GET','POST'])
def titlesearch():
    info = get_info()
    sobject = request.form['object']
    cursor.execute('SELECT title,id FROM crud_information')
    info = cursor.fetchall()
    value = ""
    for i in info:
        if sobject in i['title']:
            value += f"<h2><a href='/read/{i['id']}/'>{i['id']}-{i['title']}</a></h2><br>"
    return render_template('search.html',add_info=value)

@app.route('/descriptionsearch/',methods=['GET','POST'])
def discriptionsearch():
    info = get_info()
    sobject = request.form['object']
    cursor.execute('SELECT title,id,description FROM crud_information')
    info = cursor.fetchall()
    value = ""
    for i in info:
        if sobject in i['description']:
            value += f"<h2><a href='/read/{i['id']}/'>{i['id']}-{i['title']}</a></h2><br>"
    return render_template('search.html',add_info=value)

app.run(port=7000,debug=True)