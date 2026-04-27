import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
def test_generate_puzzle_board_shape():
    puzzle, solution = sudoku_logic.generate_puzzle()
    assert isinstance(puzzle, list)
    assert len(puzzle) == 9
    for row in puzzle:
        assert isinstance(row, list)
        assert len(row) == 9
from starter import sudoku_logic

def test_generate_puzzle_board_shape():
    puzzle, solution = sudoku_logic.generate_puzzle()
    assert isinstance(puzzle, list)
    assert len(puzzle) == 9
    for row in puzzle:
        assert isinstance(row, list)
        assert len(row) == 9
