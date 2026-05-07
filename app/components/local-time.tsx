"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Chicago",
});

export function LocalTime() {
  const [time, setTime] = useState(() => formatter.format(new Date()));

  useEffect(() => {
    const update = () => setTime(formatter.format(new Date()));

    update();

    const intervalId = window.setInterval(update, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return <span>{time} Local</span>;
}
