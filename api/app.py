#!/bin/py

# Pseudocode plan
# Flask server to handle all new PRs
# Dump into a DB (Supabase)

from flask import Flask, request, jsonify
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

app = Flask(__name__)

@app.route('/')
def home():
    return 

@app.route('/api/webhooks/github', methods=['POST'])
def github_webhook():
    try:
        payload = request.get_json()
        print(payload)
        event_type = request.headers.get('X-GitHub-Event')
        
        print(f"Received {event_type} event")
        
        if event_type == 'pull_request':
            pr_data = payload.get('pull_request', {})
            repo_data = payload.get('repository', {})

            result = supabase.rpc('handle_pr_webhook', {
                'repo_name': repo_data.get('name'),
                'repo_full_name': repo_data.get('full_name'),
                'repo_owner': repo_data.get('owner', {}).get('login'),
                'pr_num': pr_data.get('number'),
                'pr_title': pr_data.get('title'),
                'pr_state': pr_data.get('state'),
                'pr_author': pr_data.get('user', {}).get('login'),
                'pr_url': pr_data.get('html_url'),
                'pr_created_at': pr_data.get('created_at'),
                'pr_updated_at': pr_data.get('updated_at')
            }).execute()
            
            print(f"Stored PR: {pr_data.get('title')}")
            return jsonify({"message": "Success", "event": event_type})
        
        elif event_type:
            return jsonify({"message": "Not Pull Request", "event": event_type})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/prs')
def get_prs():
    try:
        if not supabase:
            return jsonify({"error": "Database not available"}), 500
            
        result = supabase.table('pull_requests')\
            .select('*, repositories(name, owner)')\
            .order('created_at', desc=True)\
            .execute()
        
        return jsonify({"data": result.data})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()