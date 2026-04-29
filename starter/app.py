from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    clues = int(request.args.get('clues', 35))
    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({
        'puzzle': puzzle,
        'solution': solution
    })
@app.route('/check', methods=['POST'])
def check_solution():
    data = request.get_json(silent=True)

    if not data or 'board' not in data:
        return jsonify({'error': 'Invalid request: missing board'}), 400

    board = data['board']
    solution = CURRENT.get('solution')

    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    # validate board shape
    if not isinstance(board, list) or len(board) != sudoku_logic.SIZE:
        return jsonify({'error': 'Invalid board format'}), 400

    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            try:
                if board[i][j] != solution[i][j]:
                    incorrect.append([i, j])
            except Exception:
                return jsonify({'error': 'Malformed board data'}), 400

    return jsonify({'incorrect': incorrect})
if __name__ == '__main__':
    app.run(debug=True)