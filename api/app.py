#!/bin/py

# Pseudocode plan
# Flask server to handle all new PRs
# Dump into a DB (Supabase)

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return "Nixo Hire Project"

@app.route('/api/webhooks/github', methods=['POST'])
def github_webhook():
    try:
        payload = request.get_json()
        event_type = request.headers.get('X-GitHub-Event')
        
        print(f"Received {event_type} event")
        
        if event_type == 'pull_request':
            pr = payload.get('pull_request', {})
            print(f"PR: {pr.get('title', 'No title')}")
            # TODO: Save to Supabase here
        
        return jsonify({"message": "Success", "event": event_type})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

# Vercel thing I guess
app = app
