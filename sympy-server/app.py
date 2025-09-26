#!/usr/bin/env python3
"""
Simple SymPy server for Agentic Math Chrome Extension
Handles complex mathematical expressions that math.js cannot solve
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sympy as sp
from sympy import *
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/solve', methods=['POST'])
def solve():
    """Solve mathematical expression using SymPy"""
    try:
        data = request.get_json()
        if not data or 'expression' not in data:
            return jsonify({'error': 'No expression provided'}), 400
            
        expr_str = data['expression'].strip()
        logger.info(f"Solving expression: {expr_str}")
        
        # Parse and solve the expression
        try:
            # Try to parse as SymPy expression
            expr = sp.sympify(expr_str)
            
            # Check if it's a function call (like integrate, diff, etc.)
            if hasattr(expr, 'func') and expr.func in [sp.Integral, sp.integrate, sp.diff, sp.Derivative]:
                # For calculus operations, evaluate them
                result = str(expr.doit())
            elif expr.is_number:
                result = str(expr.evalf())
            elif expr.has(sp.Symbol):
                # If it has variables, try to simplify
                result = str(sp.simplify(expr))
            else:
                # Evaluate numerically
                result = str(expr.evalf())
                
        except (sp.SympifyError, ValueError) as e:
            logger.error(f"SymPy parsing error: {e}")
            return jsonify({'error': f'Invalid mathematical expression: {str(e)}'}), 400
        
        logger.info(f"Result: {result}")
        return jsonify({'result': result})
        
    except Exception as e:
        logger.error(f"Server error: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'version': '1.0.0'})

@app.route('/', methods=['GET'])
def home():
    """Basic info endpoint"""
    return jsonify({
        'name': 'SymPy Math Server',
        'description': 'Solves complex mathematical expressions for Agentic Math Extension',
        'endpoints': {
            '/solve': 'POST - Solve mathematical expressions',
            '/health': 'GET - Health check'
        }
    })

if __name__ == '__main__':
    print("Starting SymPy Math Server...")
    print("Server will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    app.run(host='0.0.0.0', port=5000, debug=False)