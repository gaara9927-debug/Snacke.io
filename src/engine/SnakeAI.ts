import { AppleItem, PortalPair, SnakeSegment, SnakeAIDebugInfo } from '../types';
import { GRID_COLS, GRID_ROWS } from '../constants';

export interface Point {
  x: number;
  y: number;
}

export class SnakeAI {
  private lastPositions: Point[] = [];
  private maxHistory = 16;
  private currentMode: SnakeAIDebugInfo['mode'] = 'safe_wander';

  public getMode(): SnakeAIDebugInfo['mode'] {
    return this.currentMode;
  }

  /**
   * Calculates the best next direction for the snake to move.
   * Priority:
   * 1. DO NOT DIE (Never collide with walls or body).
   * 2. DO NOT GET TRAPPED (Never enter a dead-end with less space than snake length).
   * 3. SEEK BEST APPLE (Score = value / distance - risk, with guaranteed escape route).
   * 4. FOLLOW TAIL / SAFE ROAM (If apples are unreachable or too dangerous).
   */
  public getNextMove(
    head: Point,
    body: Point[], // Head is body[0]
    apples: AppleItem[],
    portals: PortalPair[] = [],
    growthPending: number = 0
  ): { direction: Point; debug: SnakeAIDebugInfo } {
    const neck = body.length > 1 ? body[1] : null;
    const tail = body.length > 0 ? body[body.length - 1] : head;
    const effectiveSnakeLength = body.length + growthPending;

    // Track position history to detect cyclic trapped loops
    this.recordPosition(head);
    const isCircling = this.detectCyclicBehavior(head);

    // 1. Generate available immediate safe moves (up, down, left, right)
    const validMoves = this.getImmediateSafeMoves(head, body, neck);

    if (validMoves.length === 0) {
      // Complete trap: fallback to any non-reverse move to avoid instant crash if possible
      const fallback = neck ? { x: head.x - neck.x, y: head.y - neck.y } : { x: 1, y: 0 };
      this.currentMode = 'emergency_evasion';
      return {
        direction: fallback,
        debug: {
          targetApple: null,
          targetScore: 0,
          pathLength: 0,
          mode: 'emergency_evasion',
          reachableCells: 0,
          riskFactor: 1,
        },
      };
    }

    if (validMoves.length === 1) {
      // Only 1 safe move exists, must take it immediately
      const move = validMoves[0];
      const space = this.floodFill(move, body);
      this.currentMode = 'emergency_evasion';
      return {
        direction: { x: move.x - head.x, y: move.y - head.y },
        debug: {
          targetApple: null,
          targetScore: 0,
          pathLength: 1,
          mode: 'emergency_evasion',
          reachableCells: space,
          riskFactor: space < effectiveSnakeLength ? 0.9 : 0.2,
        },
      };
    }

    // 2. Evaluate all candidate apples using targetScore
    let bestApple: AppleItem | null = null;
    let bestScore = -Infinity;
    let bestPathToApple: Point[] | null = null;

    if (!isCircling && apples.length > 0) {
      for (const apple of apples) {
        // Find shortest path to this apple (taking portals into account if available)
        const path = this.findPath(head, { x: apple.x, y: apple.y }, body, portals);
        if (!path || path.length < 2) continue;

        const distance = path.length - 1;

        // Virtual simulation: what will the body look like when reaching this apple?
        const simulatedBody = this.simulateBodyAlongPath(body, path);
        const applePos = { x: apple.x, y: apple.y };

        // Test if from the apple position, the snake still has a safe exit (can reach its tail or sufficient open space)
        const reachableAtApple = this.floodFill(applePos, simulatedBody);
        const canReachTail = this.canReachTailFrom(applePos, simulatedBody);

        const hasSafeExit = canReachTail || reachableAtApple >= Math.min(effectiveSnakeLength * 1.2, 35);
        if (!hasSafeExit) {
          // Extremely dangerous apple that creates a trap
          continue;
        }

        // Wall proximity penalty: apples hugging corners or edges carry slight risk
        const wallDist = Math.min(
          apple.x,
          GRID_COLS - 1 - apple.x,
          apple.y,
          GRID_ROWS - 1 - apple.y
        );
        const wallPenalty = wallDist === 0 ? 0.25 : wallDist === 1 ? 0.1 : 0;

        // Space safety ratio
        const spaceSafetyRatio = Math.min(reachableAtApple / (effectiveSnakeLength + 5), 2.5);

        // Scoring formula: (AppleValue * 12) / (distance^0.85) * spaceFactor - wallPenalty
        const valueWeight = apple.isEventSpecial ? apple.value * 1.5 : apple.value;
        const targetScore =
          (valueWeight * 14) / Math.pow(distance + 1, 0.85) +
          spaceSafetyRatio * 8 -
          wallPenalty * 15;

        if (targetScore > bestScore) {
          bestScore = targetScore;
          bestApple = apple;
          bestPathToApple = path;
        }
      }
    }

    // 3. If a safe best apple was found and the first step is safe, take it!
    if (bestApple && bestPathToApple && bestPathToApple.length >= 2) {
      const nextStep = bestPathToApple[1];
      // Verify next step does not immediately close off the snake
      const spaceNext = this.floodFill(nextStep, body);
      if (spaceNext >= Math.min(effectiveSnakeLength, 20) || this.canReachTailFrom(nextStep, body)) {
        this.currentMode = 'seeking_apple';
        const direction = this.getDirectionBetween(head, nextStep, portals);
        return {
          direction,
          debug: {
            targetApple: bestApple,
            targetScore: Math.round(bestScore * 10) / 10,
            pathLength: bestPathToApple.length - 1,
            mode: 'seeking_apple',
            reachableCells: spaceNext,
            riskFactor: Math.max(0, 1 - spaceNext / (effectiveSnakeLength + 10)),
          },
        };
      }
    }

    // 4. Fallback A: Follow tail (Longest/Safe path to tail)
    // The tail is vacating, so moving towards tail is the safest self-preserving strategy
    const tailPath = this.findLongestPathToTail(head, tail, body, validMoves);
    if (tailPath) {
      this.currentMode = 'tail_following';
      const nextStep = tailPath;
      const direction = { x: nextStep.x - head.x, y: nextStep.y - head.y };
      const space = this.floodFill(nextStep, body);
      return {
        direction,
        debug: {
          targetApple: null,
          targetScore: 0,
          pathLength: 1,
          mode: 'tail_following',
          reachableCells: space,
          riskFactor: 0.15,
        },
      };
    }

    // 5. Fallback B: Safe Wander (Pick move with maximum flood fill space)
    let bestMove = validMoves[0];
    let maxSpace = -1;

    for (const move of validMoves) {
      const space = this.floodFill(move, body);
      // Prefer moves that are further from borders if space is similar
      const distToBorder = Math.min(
        move.x,
        GRID_COLS - 1 - move.x,
        move.y,
        GRID_ROWS - 1 - move.y
      );
      const moveScore = space * 10 + distToBorder;

      if (moveScore > maxSpace) {
        maxSpace = moveScore;
        bestMove = move;
      }
    }

    this.currentMode = 'safe_wander';
    return {
      direction: { x: bestMove.x - head.x, y: bestMove.y - head.y },
      debug: {
        targetApple: null,
        targetScore: 0,
        pathLength: 0,
        mode: 'safe_wander',
        reachableCells: maxSpace,
        riskFactor: 0.3,
      },
    };
  }

  /**
   * Computes the step direction taking portals into consideration.
   */
  private getDirectionBetween(from: Point, to: Point, portals: PortalPair[]): Point {
    // Check if to is connected via portal
    for (const p of portals) {
      if (
        (from.x === p.portalA.x && from.y === p.portalA.y && to.x === p.portalB.x && to.y === p.portalB.y) ||
        (from.x === p.portalB.x && from.y === p.portalB.y && to.x === p.portalA.x && to.y === p.portalA.y)
      ) {
        // Step directly into the portal entrance
        return { x: 0, y: 0 }; // Teleport is handled by engine
      }
    }
    return { x: to.x - from.x, y: to.y - from.y };
  }

  /**
   * Immediate 1-step candidates that don't collide with walls or body
   */
  private getImmediateSafeMoves(head: Point, body: Point[], neck: Point | null): Point[] {
    const deltas: Point[] = [
      { x: 0, y: -1 }, // Up
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 },  // Right
    ];

    const moves: Point[] = [];
    // Tail is safe to step onto IF it will move away on next tick
    const safeTail = body.length > 1 ? body[body.length - 1] : null;

    for (const d of deltas) {
      const nx = head.x + d.x;
      const ny = head.y + d.y;

      // Inside grid boundaries
      if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;

      // Not stepping backwards onto neck
      if (neck && nx === neck.x && ny === neck.y) continue;

      // Check collision with body
      let collides = false;
      for (let i = 0; i < body.length - 1; i++) {
        if (body[i].x === nx && body[i].y === ny) {
          collides = true;
          break;
        }
      }

      // Check tail exception
      if (safeTail && nx === safeTail.x && ny === safeTail.y) {
        // If snake length is >= 3, stepping on tail is usually safe
        collides = false;
      }

      if (!collides) {
        moves.push({ x: nx, y: ny });
      }
    }

    return moves;
  }

  /**
   * BFS Shortest Path algorithm with portal traversal support
   */
  public findPath(
    start: Point,
    target: Point,
    body: Point[],
    portals: PortalPair[] = []
  ): Point[] | null {
    const queue: Point[] = [start];
    const visited = new Uint8Array(GRID_COLS * GRID_ROWS);
    const parent = new Map<number, Point>();

    // Mark body as obstacle (except tail)
    for (let i = 0; i < body.length - 1; i++) {
      visited[body[i].y * GRID_COLS + body[i].x] = 1;
    }

    visited[start.y * GRID_COLS + start.x] = 1;

    const deltas: Point[] = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    let found = false;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === target.x && current.y === target.y) {
        found = true;
        break;
      }

      const neighbors: Point[] = [];

      // Standard grid neighbors
      for (const d of deltas) {
        const nx = current.x + d.x;
        const ny = current.y + d.y;
        if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
          neighbors.push({ x: nx, y: ny });
        }
      }

      // Portal connections
      for (const p of portals) {
        if (current.x === p.portalA.x && current.y === p.portalA.y) {
          neighbors.push({ x: p.portalB.x, y: p.portalB.y });
        } else if (current.x === p.portalB.x && current.y === p.portalB.y) {
          neighbors.push({ x: p.portalA.x, y: p.portalA.y });
        }
      }

      for (const neighbor of neighbors) {
        const idx = neighbor.y * GRID_COLS + neighbor.x;
        if (visited[idx] === 0) {
          visited[idx] = 1;
          parent.set(idx, current);
          queue.push(neighbor);
        }
      }
    }

    if (!found) return null;

    // Reconstruct path
    const path: Point[] = [];
    let curr: Point | undefined = target;

    while (curr) {
      path.push(curr);
      if (curr.x === start.x && curr.y === start.y) break;
      const idx = curr.y * GRID_COLS + curr.x;
      curr = parent.get(idx);
    }

    return path.reverse();
  }

  /**
   * Flood Fill: counts how many connected free cells are reachable from a start point
   */
  public floodFill(start: Point, obstacles: Point[]): number {
    const queue: Point[] = [start];
    const visited = new Uint8Array(GRID_COLS * GRID_ROWS);

    for (const obs of obstacles) {
      if (obs.x >= 0 && obs.x < GRID_COLS && obs.y >= 0 && obs.y < GRID_ROWS) {
        visited[obs.y * GRID_COLS + obs.x] = 1;
      }
    }

    const startIdx = start.y * GRID_COLS + start.x;
    if (visited[startIdx] === 1) return 0;
    visited[startIdx] = 1;

    let count = 1;
    const deltas: Point[] = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const d of deltas) {
        const nx = cur.x + d.x;
        const ny = cur.y + d.y;
        if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
          const idx = ny * GRID_COLS + nx;
          if (visited[idx] === 0) {
            visited[idx] = 1;
            count++;
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    return count;
  }

  /**
   * Checks if there is an open pathway from a position to the snake's tail
   */
  public canReachTailFrom(start: Point, body: Point[]): boolean {
    if (body.length < 2) return true;
    const tail = body[body.length - 1];
    const path = this.findPath(start, tail, body);
    return path !== null && path.length > 0;
  }

  /**
   * Finds the safest move towards the tail (tail-following loop)
   */
  private findLongestPathToTail(head: Point, tail: Point, body: Point[], candidates: Point[]): Point | null {
    let bestCandidate: Point | null = null;
    let maxDistance = -1;

    for (const candidate of candidates) {
      // Check if candidate can reach tail
      const path = this.findPath(candidate, tail, body);
      if (path && path.length > 0) {
        // Safe candidate found
        const space = this.floodFill(candidate, body);
        if (space > maxDistance) {
          maxDistance = space;
          bestCandidate = candidate;
        }
      }
    }

    return bestCandidate;
  }

  /**
   * Simulates body positions after walking a given path
   */
  private simulateBodyAlongPath(currentBody: Point[], path: Point[]): Point[] {
    const steps = path.length - 1;
    const newBody: Point[] = [];

    // Add path segments in reverse (path[steps] is the new head)
    for (let i = steps; i >= 0; i--) {
      newBody.push(path[i]);
    }

    // Keep remaining current body up to length
    for (let i = 0; i < currentBody.length; i++) {
      if (newBody.length >= currentBody.length) break;
      newBody.push(currentBody[i]);
    }

    return newBody;
  }

  private recordPosition(pos: Point): void {
    this.lastPositions.push({ ...pos });
    if (this.lastPositions.length > this.maxHistory) {
      this.lastPositions.shift();
    }
  }

  /**
   * Detects if the snake has been moving in small circles or repeating the same 4-8 coordinates
   */
  private detectCyclicBehavior(pos: Point): boolean {
    if (this.lastPositions.length < 8) return false;
    let matches = 0;
    for (const prev of this.lastPositions) {
      if (prev.x === pos.x && prev.y === pos.y) {
        matches++;
      }
    }
    return matches >= 3;
  }
}
