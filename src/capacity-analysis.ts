const fs = require('fs');

interface IDate {
	date: string,
	day: string,
	schedule?: string;
	capacity?: number;
}

interface IFiles {
	calendar: string[][];
	personnel: string[][];
	shifts: string[][];
}

/**
 * Gets the day of the week code for a given date.
 * @param {Date} date
 */
const getDayOfWeek = (date: Date) => {
	const dayOfWeek = [
		'M',
		'T',
		'W',
		'H',
		'F',
		'R',
		'S'
	]
	return dayOfWeek[date.getDay()];
};

/**
 * Retrieves the input files from the given directory.
 * @param {string} inputDirectory
 */
const getInputFiles = (inputDirectory: string) => {
	const calendar = fs.readFileSync(`${inputDirectory}/Calendars.txt`, 'utf8');
	const personnel = fs.readFileSync(`${inputDirectory}/Personnel.txt`, 'utf8');
	const shifts = fs.readFileSync(`${inputDirectory}/Shifts.txt`, 'utf8');
	return ({
		calendar: parseFiles(calendar),
		personnel: parseFiles(personnel),
		shifts: parseFiles(shifts)
	});
};

/**
 * Increments the date range and returns that date.
 */
const addDays = function (currentDate: Date, days: number) {
	var date = new Date(currentDate);
	date.setDate(date.getDate() + days);
	return date;
};

/**
 * Creates an array of IDate objects given a range of dates.
 * This was done to account for month and year rollover.
 * @param {string} start date in YYYY.MM.DD format
 * @param {string} end date in YYYY.MM.DD format
 * @return {IDate[]} { date: string, day: 'M' | 'T' | 'W' | 'H' | 'F' | 'R' | 'S' }
 */
const getDateRange = (start: string, end: string) => {
	const dateArray = [];
	let currentDate = new Date(start);
	while (currentDate <= new Date(end)) {
		dateArray.push({
			date: new Date(currentDate).toISOString()
				.split('T')[0]
				.replace(/-/g, '.'),
			day: getDayOfWeek(currentDate)
		});
		currentDate = addDays(currentDate, 1);
	}
	return dateArray;
};

/**
 * Converts a string of file contents into an array of arrays by splitting first on line breaks and then on pipes.
 * @param {string} fileString
 */
const parseFiles = (fileString: string) => {
	return fileString.split(/\r?\n/)
		.map(string => string.split('|'));
};

/**
 * Get the shift registered for a particular employee.
 * @param {string[][]} shifts
 * @param {string} employeeId
 */
const getShiftForEmployee = (shifts: string[][], employeeId: string) => {
	return shifts.find(shift => shift.includes(employeeId));
};

/**
 * Retrieves the calender for a given code
 * @param {string[][]} calendar
 * @param {string} calendarCode
 */
const getCalendarForCode = (calendar: string[][], calendarCode: string) => {
	return calendar.filter(cal => cal[0] === calendarCode);
}

/**
 * Gets the schedule for a given employee and date range by checking their shift registry for that range first, then their regular calendar schedule.
 * If no data is found, the schedule for that particular day is returned as 'OFF'.
 * @param {IDate[]} range
 * @param {string[][]} calendar an array of calendar objects for a given employee
 * @param {string[] | undefined} shift provided if the employee has a shift schedule registered
 */
const getSchedule = (range: IDate[], calendar: string[][], shift?: string[]) => {
	return range.map(date => {
		const calForDate = calendar.find(cal => cal[1].includes(date.day));
		date.schedule = shift && shift[1] && shift[1].split('').includes(date.day)
			? shift[2]
			: calForDate
				? calForDate[2]
				: 'OFF';
		return date;
	});
};

const makeCapacityOutput = (range: IDate[]) => {
	let output = `${range[0].date} - ${(range.pop() as IDate).date}\r\n`;
	range.forEach(date => {
		output += `${date.date}|${date.capacity} hours\r\n`;
	});
	return output;
};

/**
 * Primary function for running the 'dailyCapacity' task.
 * @param {IFiles} files
 * @param {IDate[]} range 
 */
const runDailyCapacity = (files: IFiles, range: IDate[]) => {
	range.forEach((date) => {
		date.capacity = files.personnel.map((person) => {
			if (person) {
				const shift = getShiftForEmployee(files.shifts, person[0]);
				const calendar = getCalendarForCode(files.calendar, person[4]);
				const [schedule] = getSchedule([date], calendar, shift);
				if (schedule && schedule.schedule) {
					let hours: string | number[] = schedule.schedule;
					if (hours === 'OFF') {
						return 0;
					} else {
						hours = hours && hours.split('-')
							.map(hour => Number(hour) / 100) || [0, 0];
						return (hours[1] - hours[0]);
					}
				}
			}
			return 0;
		})
			.reduce((acc, cur) => {
				return acc + cur;
			});
	});
	return makeCapacityOutput(range);
};

/**
 * Formats the schedule for saving to file
 * @param {string} name the properly formatted employee's name
 * @param {IDate[]} schedule an array of scheduled dates
 */
const makeScheduleOutput = (name: string, schedule: IDate[]) => {
	let output = `${name}: ${schedule[0].date} - ${(schedule.pop() as IDate).date}\r\n`;
	schedule.forEach(date => {
		output += `${date.date}|${date.schedule}\r\n`;
	});
	return output;
};

/**
 * Primary function for running the 'dailySchedule' task
 * @param {IFiles} files parsed object of input files
 * @param {IDate[]} range range of IDate objects for the request
 * @param {string} employeeId unique identifier for the employee
 */
const runDailySchedule = (files: IFiles, range: IDate[], employeeId: string) => {
	const employee = files.personnel.find(person => {
		return person[0] === employeeId
	});
	if (employee) {
		const name = `${employee[3]} ${employee[2]} ${employee[1]}`;
		const shift = getShiftForEmployee(files.shifts, employeeId);
		const calendar = getCalendarForCode(files.calendar, employee[4]);
		const schedule = getSchedule(range, calendar, shift);
		return makeScheduleOutput(name, schedule);
	} else {
		console.log(`Employee ${employeeId} Not Found`);
		return null;
	}
};

const writeFile = (outputDirectory: string, executionMode: string, output: string) => {
	fs.writeFileSync(`${outputDirectory}/${executionMode}.txt`, output, 'utf8');
	console.log(`Successfully created file "${executionMode}.txt" in "${outputDirectory}"`);
};

!async function () {
	const directory = process.argv[2],
		executionMode = process.argv[3].replace(/^\w/, c => c.toUpperCase()),
		rangeStart = process.argv[4],
		rangeEnd = process.argv[5],
		employeeId = process.argv[6],
		files = getInputFiles(directory),
		range = getDateRange(rangeStart, rangeEnd);

	if (executionMode === 'DailyCapacity') {
		const output = runDailyCapacity(files, range);
		if (output) return writeFile(directory, executionMode, output);
	} else if (executionMode === 'DailySchedule') {
		const output = runDailySchedule(files, range, employeeId);
		if (output) return writeFile(directory, executionMode, output);
	} else {
		console.log('Invalid Task Type.  Acceptable values are "dailyCapacity" or "dailySchedule".');
	}
}();

