import { useState } from 'react'
import { Pencil, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useData } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import type { StudentGrade } from '@/types'

function gradeVariant(v: number) {
  if (v >= 85) return 'success'
  if (v >= 60) return 'amber'
  return 'rose'
}

export default function TeacherGradesPage() {
  const { grades, updateGrade } = useData()
  const { toast } = useToast()
  const [editing, setEditing] = useState<StudentGrade | null>(null)
  const [homeworkAvg, setHomeworkAvg] = useState('')
  const [quizAvg, setQuizAvg] = useState('')

  function openEdit(g: StudentGrade) {
    setEditing(g)
    setHomeworkAvg(g.homeworkAvg.toString())
    setQuizAvg(g.quizAvg.toString())
  }

  async function save() {
    if (!editing) return
    const hw = Number(homeworkAvg)
    const qz = Number(quizAvg)
    try {
      await updateGrade(editing.studentId, hw, qz)
      toast({ title: `تم تحديث درجات ${editing.studentName}`, variant: 'success' })
      setEditing(null)
    } catch {
      // error toast already shown by DataContext
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">الدرجات</h2>
        <p className="text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)] mt-1 text-sm">
          استعراض وتعديل درجات جميع الطلاب
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 dark:border-[var(--color-dark-border)] text-[var(--color-ink-soft)] dark:text-[var(--color-dark-ink-soft)]">
                  <th className="text-right font-semibold p-4">الطالب</th>
                  <th className="text-right font-semibold p-4">معدل الواجبات</th>
                  <th className="text-right font-semibold p-4">معدل الاختبارات</th>
                  <th className="text-right font-semibold p-4">المعدل العام</th>
                  <th className="text-right font-semibold p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.studentId} className="border-b border-black/5 dark:border-[var(--color-dark-border)] last:border-0">
                    <td className="p-4 font-semibold">{g.studentName}</td>
                    <td className="p-4">{g.homeworkAvg}%</td>
                    <td className="p-4">{g.quizAvg}%</td>
                    <td className="p-4">
                      <Badge variant={gradeVariant(g.overall)}>{g.overall}%</Badge>
                    </td>
                    <td className="p-4">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(g)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[var(--color-amber-500)]" /> تعديل درجات {editing?.studentName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>معدل الواجبات (%)</Label>
              <Input type="number" min={0} max={100} value={homeworkAvg} onChange={(e) => setHomeworkAvg(e.target.value)} />
            </div>
            <div>
              <Label>معدل الاختبارات (%)</Label>
              <Input type="number" min={0} max={100} value={quizAvg} onChange={(e) => setQuizAvg(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button onClick={save}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
