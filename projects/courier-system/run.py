from app import app

if __name__ == '__main__':
    print("🚚 Courier System Starting...")
    print("✅ Login: admin/admin123 or staff/admin123")
    app.run(debug=True, host='0.0.0.0', port=5000)