from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import mysql.connector
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'simple-key-123'

# Database config
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',  # YOUR MySQL PASSWORD
    'database': 'courier_system'
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# Simple stats cache
stats_cache = {'total': 0, 'delivered': 0, 'pending': 0, 'transit': 0}

def update_stats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT status, COUNT(*) as count FROM parcels GROUP BY status")
    results = cursor.fetchall()
    
    stats = {'total': 0, 'delivered': 0, 'pending': 0, 'transit': 0}
    for row in results:
        stats['total'] += row['count']
        if row['status'] == 'Delivered': stats['delivered'] = row['count']
        elif row['status'] == 'Pending': stats['pending'] = row['count']
        elif row['status'] == 'In Transit': stats['transit'] = row['count']
    
    global stats_cache
    stats_cache = stats
    conn.close()

@app.route('/')
def index():
    if 'user_id' in session: return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Invalid credentials'})
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('login'))
    update_stats()
    return render_template('dashboard.html', stats=stats_cache)

@app.route('/api/stats')
def api_stats(): return jsonify(stats_cache)

@app.route('/api/parcels')
def api_parcels():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM parcels ORDER BY created_at DESC LIMIT 10")
    parcels = cursor.fetchall()
    conn.close()
    return jsonify(parcels)

@app.route('/api/parcels/<tracking_id>')
def api_track_parcel(tracking_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM parcels WHERE tracking_id = %s", (tracking_id,))
    parcel = cursor.fetchone()
    conn.close()
    if parcel: return jsonify({'success': True, 'parcel': parcel})
    return jsonify({'success': False, 'message': 'Not found'})

@app.route('/api/parcels/add', methods=['POST'])
def api_add_parcel():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO parcels (tracking_id, sender_name, receiver_name, parcel_type, status, expected_date)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (data['tracking_id'], data['sender_name'], data['receiver_name'],
              data['parcel_type'], data['status'], data['expected_date']))
        conn.commit()
        update_stats()
        conn.close()
        return jsonify({'success': True, 'message': 'Added!'})
    except:
        conn.close()
        return jsonify({'success': False, 'message': 'Tracking ID exists'})

@app.route('/api/parcels/<tracking_id>/status', methods=['PUT'])
def api_update_status(tracking_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE parcels SET status = %s WHERE tracking_id = %s", (data['status'], tracking_id))
    if cursor.rowcount > 0:
        conn.commit()
        update_stats()
        conn.close()
        return jsonify({'success': True})
    conn.close()
    return jsonify({'success': False})

@app.route('/api/parcels/<tracking_id>', methods=['DELETE'])
def api_delete_parcel(tracking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM parcels WHERE tracking_id = %s", (tracking_id,))
    if cursor.rowcount > 0:
        conn.commit()
        update_stats()
        conn.close()
        return jsonify({'success': True})
    conn.close()
    return jsonify({'success': False})

if __name__ == '__main__':
    update_stats()
    app.run(debug=True)