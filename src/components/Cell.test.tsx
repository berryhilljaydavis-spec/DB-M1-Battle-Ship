import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { Cell } from './Cell'

function renderCell(state: 'empty' | 'ship' | 'hit' | 'miss') {
  return render(
    <Cell row={0} col={0} state={state} revealShips interactive={false} />,
  )
}

describe('Cell explosion', () => {
  it('bursts when a cell turns into a hit', () => {
    const { container, rerender } = renderCell('ship')
    expect(container.querySelector('.blast')).toBeNull()

    rerender(
      <Cell row={0} col={0} state="hit" revealShips interactive={false} />,
    )
    expect(container.querySelector('.blast')).not.toBeNull()
    expect(container.querySelector('.cell-slot--blasting')).not.toBeNull()
  })

  it('does not burst on a miss', () => {
    const { container, rerender } = renderCell('empty')
    rerender(
      <Cell row={0} col={0} state="miss" revealShips interactive={false} />,
    )
    expect(container.querySelector('.blast')).toBeNull()
  })

  it('does not burst for a cell that mounts already hit', () => {
    const { container } = renderCell('hit')
    expect(container.querySelector('.blast')).toBeNull()
  })
})

describe('Cell dragging', () => {
  it('writes drag data so browsers start the drag', () => {
    const onDragStart = vi.fn()
    const { container } = render(
      <Cell
        row={2}
        col={3}
        state="ship"
        revealShips
        interactive
        draggable
        onDragStart={onDragStart}
        onDrop={() => {}}
      />,
    )
    const dataTransfer = {
      effectAllowed: 'none',
      dropEffect: 'none',
      setData: vi.fn(),
    }

    fireEvent.dragStart(container.querySelector('.cell')!, { dataTransfer })

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', '2,3')
    expect(dataTransfer.effectAllowed).toBe('move')
    expect(onDragStart).toHaveBeenCalledWith(2, 3)
  })
})
