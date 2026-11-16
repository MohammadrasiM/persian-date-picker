import { useState } from "react";
import { createRoot } from "react-dom/client";
import DatePicker, { DatePickerModal, type DatePickerSelectedDate } from "../src/index.js";
import "../dist/styles.css";

function Example() {
  const [selectedDate, setSelectedDate] = useState<DatePickerSelectedDate>();
  const [open, setOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <main style={{ maxWidth: 360, margin: "24px auto", padding: 12, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20 }}>Persian DatePicker</h1>
      <button id="outside-button" onClick={() => setOpen(!open)}>
        Toggle picker
      </button>
      <button
        id="modal-button"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
        onClick={() => setModalOpen(true)}
      >
        Open modal datepicker
      </button>
      <DatePickerModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      {open && (
        <DatePicker
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onSubmit={() => setOpen(false)}
        />
      )}
      <p aria-live="polite">
        {selectedDate
          ? `${selectedDate.year}/${selectedDate.month}/${selectedDate.day}`
          : "No confirmed date"}
      </p>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Example />);
