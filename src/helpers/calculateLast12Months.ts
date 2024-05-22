export default function calculateLast12Months(
    currentDate: Date,
    currentYear: number
  ): { month: number; name: string; year: number }[] {
    return Array.from({ length: 12 }, (_, index) => {
      let month: number = currentDate.getMonth() - index;
      let year: number = currentYear;
      if (month < 0) {
        month += 12;
        year -= 1; // Adjust year for months before January
      }
      return {
        month: month + 1,
        name: new Date(year, month, 1).toLocaleString("en-US", {
          month: "short",
        }),
        year,
      };
    }).reverse();
  }