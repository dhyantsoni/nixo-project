# nixo-project

Start a virtual environment
```
python -m venv venv
source venv/bin/activate
```

Download dependencies
```
pip -r requirements.txt
```

Create a .env file populated with the following
```
SUPABASE_URL
SUPABASE_ANON
```

Start your Flask server
```
python3 app.py
```

Connect your ngrok account & run ngrok
```
ngrok http 5000
```

Copy your ngrok URL and set up GitHub webhooks with it, make sure to select send me everything

<img width="856" height="956" alt="image" src="https://github.com/user-attachments/assets/4cc2b89a-52fc-4bc6-baad-b497ea643088" />
