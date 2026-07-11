import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { employeeApi, hotelApi, roomApi, taskApi } from '../../api/endpoints'
import type { TaskDto, TaskStatus } from '../../api/types'
import { problemMessage } from '../../api/client'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { PriorityBadge } from '../../components/ui/StatusBadge'
import { EmptyState, ErrorNote, ListSkeleton } from '../../components/ui/Feedback'
import { date } from '../../lib/format'
import { useLabels } from '../../lib/labels'

const COLUMNS: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE']

function TaskForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
  const [hotelId, setHotelId] = useState<number | ''>('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [assignees, setAssignees] = useState<number[]>([])
  const queryClient = useQueryClient()

  const hotels = useQuery({ queryKey: ['hotels', 'all'], queryFn: () => hotelApi.search({ size: 50 }) })
  const rooms = useQuery({
    queryKey: ['rooms', 'byHotel', hotelId],
    queryFn: () => roomApi.search({ hotelId: Number(hotelId), size: 60 }),
    enabled: hotelId !== '',
  })
  const employees = useQuery({
    queryKey: ['employees', 'byHotel', hotelId],
    queryFn: () => employeeApi.search({ hotelId: Number(hotelId), status: 'ACTIVE', size: 50 }),
    enabled: hotelId !== '',
  })

  const create = useMutation({
    mutationFn: (form: FormData) =>
      taskApi.create({
        title: form.get('title'),
        description: form.get('description') || null,
        type: form.get('type'),
        priority: form.get('priority'),
        dueDate: form.get('dueDate') || null,
        hotelId,
        roomId: roomId === '' ? null : roomId,
        assigneeIds: assignees,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onDone()
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        create.mutate(new FormData(e.currentTarget))
      }}
    >
      <div>
        <label className="field-label" htmlFor="t-title">{t('admin.tasks.titleLabel')}</label>
        <input id="t-title" name="title" className="field-input" required maxLength={150} />
      </div>
      <div>
        <label className="field-label" htmlFor="t-desc">{t('admin.tasks.description')}</label>
        <textarea id="t-desc" name="description" className="field-input" rows={2} maxLength={1000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="t-type">{t('admin.tasks.type')}</label>
          <select id="t-type" name="type" className="field-input" defaultValue="CLEANING">
            {(['CLEANING','MAINTENANCE','OTHER'] as const).map((v) => (
              <option key={v} value={v}>{tLabel('taskType', v)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="t-priority">{t('admin.tasks.priority')}</label>
          <select id="t-priority" name="priority" className="field-input" defaultValue="MEDIUM">
            {(['LOW','MEDIUM','HIGH','URGENT'] as const).map((v) => (
              <option key={v} value={v}>{tLabel('taskPriority', v)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="t-due">{t('admin.tasks.dueDate')}</label>
          <input id="t-due" name="dueDate" type="date" className="field-input" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="t-hotel">Hotel</label>
          <select
            id="t-hotel" name="hotelId" className="field-input" required value={hotelId}
            onChange={(e) => { setHotelId(Number(e.target.value)); setRoomId(''); setAssignees([]) }}
          >
            <option value="" disabled>{t('admin.invoices.pickBooking').replace('reserva', 'hotel')}</option>
            {hotels.data?.content.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="t-room">{t('admin.tasks.roomOptional')}</label>
          <select
            id="t-room" name="roomId" className="field-input" value={roomId}
            onChange={(e) => setRoomId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={hotelId === ''}
          >
            <option value="">— {t('admin.rooms.title')} —</option>
            {rooms.data?.content.map((r) => <option key={r.id} value={r.id}>{r.number}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="t-assignees">{t('admin.tasks.assigneeHint')}</label>
        <select
          id="t-assignees" multiple size={4} className="field-input"
          value={assignees.map(String)}
          onChange={(e) => setAssignees([...e.currentTarget.selectedOptions].map((o) => Number(o.value)))}
          disabled={hotelId === ''}
        >
          {employees.data?.content.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.lastName}, {emp.firstName} · {tLabel('employeePosition', emp.position)}
            </option>
          ))}
        </select>
      </div>

      {create.error && <p role="alert" className="field-error">{problemMessage(create.error)}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onDone}>{t('common.close')}</button>
        <button type="submit" className="btn-primary" disabled={create.isPending || hotelId === ''}>
          {create.isPending ? t('admin.tasks.creating') : t('admin.tasks.create')}
        </button>
      </div>
    </form>
  )
}

function TaskCard({ task, onMove }: { task: TaskDto; onMove: (status: TaskStatus) => void }) {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
  return (
    <article className="card-tile p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-teal-950">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="mt-1 text-xs text-teal-800">
        {tLabel('taskType', task.type)} · {task.hotelName}
        {task.roomNumber && ` · ${t('admin.bookings.roomShort', { n: task.roomNumber })}`}
        {task.dueDate && ` · ${t('admin.tasks.due', { date: date(task.dueDate) })}`}
      </p>
      {task.assignees.length > 0 && (
        <p className="mt-1 text-xs text-teal-800">
          {task.assignees.map((a) => a.fullName).join(', ')}
        </p>
      )}
      <div className="mt-3 flex gap-1.5">
        {task.status === 'PENDING' && (
          <button className="btn-primary px-2.5 py-1 text-xs" onClick={() => onMove('IN_PROGRESS')}>
            {t('admin.tasks.start')}
          </button>
        )}
        {task.status === 'IN_PROGRESS' && (
          <button className="btn-primary px-2.5 py-1 text-xs" onClick={() => onMove('DONE')}>
            {t('admin.tasks.complete')}
          </button>
        )}
        {task.status !== 'DONE' && (
          <button className="btn-danger px-2.5 py-1 text-xs" onClick={() => onMove('CANCELLED')}>
            {t('admin.tasks.cancel')}
          </button>
        )}
      </div>
    </article>
  )
}

export default function TasksPage() {
  const { t } = useTranslation()
  const { tLabel } = useLabels()
  const [creating, setCreating] = useState(false)
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: ['tasks', 'board'],
    queryFn: () => taskApi.search({ size: 100 }),
  })

  const move = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      taskApi.changeStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  if (isPending) return <ListSkeleton rows={4} />
  if (error) return <ErrorNote error={error} />

  const byStatus = (status: TaskStatus) =>
    data?.content.filter((t) => t.status === status) ?? []

  return (
    <>
      <PageHeader
        title={t('admin.tasks.title')}
        subtitle={t('admin.tasks.subtitle')}
        actions={
          <button className="btn-gold" onClick={() => setCreating(true)}>
            {t('admin.tasks.new')}
          </button>
        }
      />

      {move.error && <div className="mb-4"><ErrorNote error={move.error} /></div>}

      {data && data.content.length === 0 ? (
        <EmptyState
          title={t('admin.tasks.emptyTitle')}
          hint={t('admin.tasks.emptyHint')}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((status) => (
            <section key={status} aria-label={tLabel('taskStatus', status)}>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-teal-800 uppercase">
                {tLabel('taskStatus', status)} · {byStatus(status).length}
              </h2>
              <div className="space-y-3">
                {byStatus(status).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMove={(next) => move.mutate({ id: task.id, status: next })}
                  />
                ))}
                {byStatus(status).length === 0 && (
                  <p className="rounded-(--radius-tile) border border-dashed border-glaze-200 px-4 py-6 text-center text-xs text-teal-800">
                    {t('admin.tasks.emptyColumn')}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={creating} title={t('admin.tasks.new')} onClose={() => setCreating(false)} wide>
        <TaskForm onDone={() => setCreating(false)} />
      </Modal>
    </>
  )
}
