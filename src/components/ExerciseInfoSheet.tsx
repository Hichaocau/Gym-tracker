import { imageUrl, KIND_LABEL, secondImage, type ExerciseInfo } from '../lib/exercises'
import { Sheet } from './ui'

export function ExerciseInfoSheet({ exercise, onClose }: { exercise: ExerciseInfo; onClose: () => void }) {
  const second = exercise.image && secondImage(exercise.image)
  return (
    <Sheet
      onClose={onClose}
      title={
        <div>
          <div>{exercise.name}</div>
          {exercise.en && <div className="text-sm font-normal text-faint">{exercise.en}</div>}
        </div>
      }
    >
      <div className="flex flex-wrap gap-1.5 pb-4">
        {[exercise.group, exercise.equipment, KIND_LABEL[exercise.kind]].filter(Boolean).map((t) => (
          <span key={t} className="rounded-full bg-card2 px-2.5 py-1 text-xs font-medium text-mute">
            {t}
          </span>
        ))}
      </div>
      {exercise.image && (
        <div className="grid grid-cols-2 gap-2">
          {[exercise.image, second].map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-card2">
              <img src={imageUrl(src!)} alt={`${exercise.name} – tư thế ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium">{i === 0 ? 'Bắt đầu' : 'Kết thúc'}</span>
            </div>
          ))}
        </div>
      )}
      {exercise.instructions?.length ? (
        <ol className="mt-5 space-y-4 pb-2">
          {exercise.instructions.map((t, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">{i + 1}</span>
              <span className="pt-0.5">{t}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-4 text-sm text-faint">Bài tự thêm, chưa có hướng dẫn.</p>
      )}
    </Sheet>
  )
}
