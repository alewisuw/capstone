from flask import Blueprint, jsonify
import json
import os

bp = Blueprint('tags', __name__)

@bp.route('/api/tags', methods=['GET'])
def get_tags():
    tags_path = os.path.join(os.path.dirname(__file__), '../tagging/tags.json')
    with open(tags_path, 'r', encoding='utf-8') as f:
        tags = json.load(f)
    return jsonify(tags)
