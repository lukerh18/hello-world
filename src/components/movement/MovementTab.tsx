import { MovementPanel } from './MovementPanel'

interface MovementTabProps {
  date: string
}

export function MovementTab({ date }: MovementTabProps) {
  return <MovementPanel date={date} />
}
