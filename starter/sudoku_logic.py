import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def solve_and_count(board, max_solutions=2):
    """Counts the number of solutions for a given board. Stops at max_solutions."""
    count = [0]

    def solve(b):
        for row in range(SIZE):
            for col in range(SIZE):
                if b[row][col] == EMPTY:
                    for num in range(1, SIZE + 1):
                        if is_safe(b, row, col, num):
                            b[row][col] = num
                            solve(b)
                            b[row][col] = EMPTY
                    return
        count[0] += 1
        if count[0] >= max_solutions:
            return

    solve(deep_copy(board))
    return count[0]

def remove_cells_unique(board, clues):
    # Remove cells while ensuring unique solution
    cells = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(cells)
    removed = 0
    total_to_remove = SIZE * SIZE - clues
    for row, col in cells:
        if removed >= total_to_remove:
            break
        backup = board[row][col]
        board[row][col] = EMPTY
        if solve_and_count(board, 2) != 1:
            board[row][col] = backup  # revert if not unique
        else:
            removed += 1

def generate_puzzle(clues=34):
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells_unique(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
