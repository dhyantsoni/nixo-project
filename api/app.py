#!/bin/py

# Pseudocode plan
# Flask server to handle all new PRs
# Dump into a DB (Supabase)

from flask import Flask, request, jsonify
from supabase import create_client, Client
import os

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

app = Flask(__name__)

@app.route('/')
def home():
    return "Nixo Hire Project"

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
            
            repo_result = supabase.table('repositories').upsert({
                'name': repo_data.get('name'),
                'full_name': repo_data.get('full_name'),
                'owner': repo_data.get('owner', {}).get('login')
            }, on_conflict='full_name').execute()
            
            if not repo_result.data:
                raise Exception("Failed to insert repository")
            
            repo_id = repo_result.data[0]['id']

            supabase.table('pull_requests').upsert({
                'repo_id': repo_id,
                'pr_number': pr_data.get('number'),
                'title': pr_data.get('title'),
                'state': pr_data.get('state'),
                'author': pr_data.get('user', {}).get('login'),
                'url': pr_data.get('html_url'),
                'github_created_at': pr_data.get('created_at'),
                'github_updated_at': pr_data.get('updated_at')
            }, on_conflict=["repo_id", "pr_number"]).execute()

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

# Vercel thing I guess
app = app
