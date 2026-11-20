import { NewStudyForm } from "@/components/client"
import { todayISO } from "@/lib/dates"

export default function NewStudyPage() {
  return (
    <div className="shell py-10">
      <h1 className="screen-title">New rollout</h1>
      <p className="screen-note">Name the tool and the day it reaches people. A CSV is enough if the admin page is not connected yet.</p>
      <div className="mt-8 max-w-3xl">
        <NewStudyForm defaultDate={todayISO()} />
      </div>
    </div>
  )
}
