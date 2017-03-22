import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app
app.debug=True
port = int(os.environ.get("PORT", 7000))
app.run(host='0.0.0.0', port=port)