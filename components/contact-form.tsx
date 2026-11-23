"use client"

import { useState, type FormEvent } from "react"
import { CONTACT_EMAIL } from "@/lib/site"

export function ContactForm() {
  const [sent, setSent] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const email = String(data.get("email") ?? "").trim()
    const company = String(data.get("company") ?? "").trim()
    const note = String(data.get("note") ?? "").trim()
    const body = [`Name: ${name}`, `Company: ${company}`, `Email: ${email}`, "", note].join("\n")
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("A rollout to measure")}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <label className="field">
        <span>Name</span>
        <input className="input" name="name" required autoComplete="name" />
      </label>
      <label className="field">
        <span>Work email</span>
        <input className="input" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        <span>Company</span>
        <input className="input" name="company" required autoComplete="organization" />
      </label>
      <label className="field">
        <span>What is going out</span>
        <textarea className="input" name="note" required rows={4} placeholder="The tool, the teams, and the metric you already watch." />
      </label>
      <button className="btn" type="submit">
        Write to us
      </button>
      {sent && <p className="form-note">Your email app should open with the note. If it does not, write to {CONTACT_EMAIL}.</p>}
    </form>
  )
}
