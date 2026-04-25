import confetti from 'canvas-confetti'

/** Small burst when a block is fully checked off */
export function celebrateBlock() {
  confetti({
    particleCount: 45,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#f97316', '#22c55e', '#ffffff', '#eab308'],
    scalar: 0.9,
    gravity: 1.2,
  })
}

/** Big celebration for finishing a workout */
export function celebrateWorkout() {
  const fire = (angle: number, x: number) =>
    confetti({
      particleCount: 80,
      angle,
      spread: 65,
      origin: { x, y: 0.75 },
      colors: ['#f97316', '#fb923c', '#ffffff', '#22c55e', '#eab308'],
      scalar: 1.1,
    })

  fire(60, 0)
  setTimeout(() => fire(120, 1), 180)
  setTimeout(() =>
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.55 },
      colors: ['#f97316', '#22c55e', '#ffffff'],
      gravity: 0.9,
    }), 350)
}

/** Subtle pop for an individual item check */
export function celebrateSingle() {
  confetti({
    particleCount: 12,
    spread: 40,
    origin: { y: 0.7 },
    colors: ['#f97316', '#22c55e', '#ffffff'],
    scalar: 0.7,
    gravity: 1.5,
    ticks: 80,
  })
}
