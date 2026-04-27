import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'starter'))
from starter import sudoku_logic

def test_generate_puzzle_board_shape():
    puzzle, solution = sudoku_logic.generate_puzzle()
    assert isinstance(puzzle, list)
    assert len(puzzle) == 9
    for row in puzzle:
        assert isinstance(row, list)
        assert len(row) == 9

def test_puzzle_has_unique_solution():
    puzzle, solution = sudoku_logic.generate_puzzle()
    count = sudoku_logic.solve_and_count(puzzle, max_solutions=2)
    assert count == 1

def test_difficulty_prefilled_cells():
    puzzle_easy, _ = sudoku_logic.generate_puzzle('easy')
    puzzle_medium, _ = sudoku_logic.generate_puzzle('medium')
    puzzle_hard, _ = sudoku_logic.generate_puzzle('hard')
    def count_prefilled(puzzle):
        return sum(cell != sudoku_logic.EMPTY for row in puzzle for cell in row)
    easy_filled = count_prefilled(puzzle_easy)
    medium_filled = count_prefilled(puzzle_medium)
    hard_filled = count_prefilled(puzzle_hard)
    assert easy_filled > medium_filled > hard_filled
