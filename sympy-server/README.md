# SymPy Server

A simple Flask server that provides complex mathematical computation capabilities for the Agentic Math Chrome Extension.

## Installation

1. Make sure you have Python 3.7+ installed
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## Endpoints

- `GET /` - Server information
- `GET /health` - Health check
- `POST /solve` - Solve mathematical expressions

## Example Usage

```bash
curl -X POST http://localhost:5000/solve \
  -H "Content-Type: application/json" \
  -d '{"expression": "integrate(x**2, x)"}'
```

## Supported Mathematical Operations

- Basic arithmetic: `2 + 3 * 4`
- Algebra: `expand((x+1)**2)`
- Calculus: `integrate(x**2, x)`, `diff(sin(x), x)`
- Trigonometry: `sin(pi/4)`, `cos(0)`
- Complex numbers: `sqrt(-1)`
- Matrices: `Matrix([[1,2],[3,4]])`
- And much more via SymPy library

## Security Note

This server is intended for local development only. Do not expose it to the internet without proper authentication and security measures.