const schedule = {
  sections: [
    {
      name: "🌅 Morning",
      items: [
        {
          time: "06:00",
          endTime: "06:30",
          name: "Workout",
          emoji: "🏋️",
          isTask: true,
          description: "6:00 – 6:30 AM. Start your workout.",
        },
        {
          time: "06:45",
          endTime: "08:00",
          name: "Classwork Study",
          emoji: "📚",
          isTask: true,
          description: "6:45 – 8:00 AM. Study today's classwork.",
        },
      ],
    },
    {
      name: "💻 DSA",
      items: [
        {
          time: "17:00",
          endTime: "18:30",
          name: "LeetCode Q1",
          emoji: "💻",
          isTask: true,
          description:
            "5:00 – 6:30 PM. Complete your first LeetCode problem.",
        },
        {
          time: "18:30",
          endTime: "19:30",
          name: "Break",
          emoji: "🍽️",
          isTask: false,
        },
        {
          time: "19:30",
          endTime: "20:30",
          name: "Dinner",
          emoji: "🍽️",
          isTask: false,
        },
        {
          time: "20:30",
          endTime: "21:30",
          name: "LeetCode Q2",
          emoji: "💻",
          isTask: true,
          description:
            "8:30 – 9:30 PM. Complete your second LeetCode problem.",
        },
      ],
    },
    {
      name: "🌙 Final Block",
      items: [
        {
          time: "21:30",
          endTime: "22:30",
          name: "FCC / MERN",
          emoji: "🚀",
          isTask: true,
          description:
            "9:30 – 10:30 PM. Work on FCC or MERN project.",
        },
      ],
    },
  ],
};

// Helper: get all trackable tasks as a flat array
schedule.getAllTasks = function () {
  return schedule.sections.flatMap((s) =>
    s.items.filter((i) => i.isTask)
  );
};

module.exports = schedule;