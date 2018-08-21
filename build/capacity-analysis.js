var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require('fs');
/**
 * Gets the day of the week code for a given date.
 * @param {Date} date
 */
var getDayOfWeek = function (date) {
    var dayOfWeek = [
        'M',
        'T',
        'W',
        'H',
        'F',
        'R',
        'S'
    ];
    return dayOfWeek[date.getDay()];
};
/**
 * Retrieves the input files from the given directory.
 * @param {string} inputDirectory
 */
var getInputFiles = function (inputDirectory) {
    var calendar = fs.readFileSync(inputDirectory + "/Calendars.txt", 'utf8');
    var personnel = fs.readFileSync(inputDirectory + "/Personnel.txt", 'utf8');
    var shifts = fs.readFileSync(inputDirectory + "/Shifts.txt", 'utf8');
    return ({
        calendar: parseFiles(calendar),
        personnel: parseFiles(personnel),
        shifts: parseFiles(shifts)
    });
};
/**
 * Increments the date range and returns that date.
 */
var addDays = function (currentDate, days) {
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
var getDateRange = function (start, end) {
    var dateArray = [];
    var currentDate = new Date(start);
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
var parseFiles = function (fileString) {
    return fileString.split(/\r?\n/)
        .map(function (string) { return string.split('|'); });
};
/**
 * Get the shift registered for a particular employee.
 * @param {string[][]} shifts
 * @param {string} employeeId
 */
var getShiftForEmployee = function (shifts, employeeId) {
    return shifts.find(function (shift) { return shift.includes(employeeId); });
};
/**
 * Retrieves the calender for a given code
 * @param {string[][]} calendar
 * @param {string} calendarCode
 */
var getCalendarForCode = function (calendar, calendarCode) {
    return calendar.filter(function (cal) { return cal[0] === calendarCode; });
};
/**
 * Gets the schedule for a given employee and date range by checking their shift registry for that range first, then their regular calendar schedule.
 * If no data is found, the schedule for that particular day is returned as 'OFF'.
 * @param {IDate[]} range
 * @param {string[][]} calendar an array of calendar objects for a given employee
 * @param {string[] | undefined} shift provided if the employee has a shift schedule registered
 */
var getSchedule = function (range, calendar, shift) {
    return range.map(function (date) {
        var calForDate = calendar.find(function (cal) { return cal[1].includes(date.day); });
        date.schedule = shift && shift[1] && shift[1].split('').includes(date.day)
            ? shift[2]
            : calForDate
                ? calForDate[2]
                : 'OFF';
        return date;
    });
};
var makeCapacityOutput = function (range) {
    var output = range[0].date + " - " + range.pop().date + "\r\n";
    range.forEach(function (date) {
        output += date.date + "|" + date.capacity + " hours\r\n";
    });
    return output;
};
/**
 * Primary function for running the 'dailyCapacity' task.
 * @param {IFiles} files
 * @param {IDate[]} range
 */
var runDailyCapacity = function (files, range) {
    range.forEach(function (date) {
        date.capacity = files.personnel.map(function (person) {
            if (person) {
                var shift = getShiftForEmployee(files.shifts, person[0]);
                var calendar = getCalendarForCode(files.calendar, person[4]);
                var schedule = getSchedule([date], calendar, shift)[0];
                if (schedule && schedule.schedule) {
                    var hours = schedule.schedule;
                    if (hours === 'OFF') {
                        return 0;
                    }
                    else {
                        hours = hours && hours.split('-')
                            .map(function (hour) { return Number(hour) / 100; }) || [0, 0];
                        return (hours[1] - hours[0]);
                    }
                }
            }
            return 0;
        })
            .reduce(function (acc, cur) {
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
var makeScheduleOutput = function (name, schedule) {
    var output = name + ": " + schedule[0].date + " - " + schedule.pop().date + "\r\n";
    schedule.forEach(function (date) {
        output += date.date + "|" + date.schedule + "\r\n";
    });
    return output;
};
/**
 * Primary function for running the 'dailySchedule' task
 * @param {IFiles} files parsed object of input files
 * @param {IDate[]} range range of IDate objects for the request
 * @param {string} employeeId unique identifier for the employee
 */
var runDailySchedule = function (files, range, employeeId) {
    var employee = files.personnel.find(function (person) {
        return person[0] === employeeId;
    });
    if (employee) {
        var name = employee[3] + " " + employee[2] + " " + employee[1];
        var shift = getShiftForEmployee(files.shifts, employeeId);
        var calendar = getCalendarForCode(files.calendar, employee[4]);
        var schedule = getSchedule(range, calendar, shift);
        return makeScheduleOutput(name, schedule);
    }
    else {
        console.log("Employee " + employeeId + " Not Found");
        return null;
    }
};
var writeFile = function (outputDirectory, executionMode, output) {
    fs.writeFileSync(outputDirectory + "/" + executionMode + ".txt", output, 'utf8');
    console.log("Successfully created file \"" + executionMode + ".txt\" in \"" + outputDirectory + "\"");
};
!function () {
    return __awaiter(this, void 0, void 0, function () {
        var directory, executionMode, rangeStart, rangeEnd, employeeId, files, range, output, output;
        return __generator(this, function (_a) {
            directory = process.argv[2], executionMode = process.argv[3].replace(/^\w/, function (c) { return c.toUpperCase(); }), rangeStart = process.argv[4], rangeEnd = process.argv[5], employeeId = process.argv[6], files = getInputFiles(directory), range = getDateRange(rangeStart, rangeEnd);
            if (executionMode === 'DailyCapacity') {
                output = runDailyCapacity(files, range);
                if (output)
                    return [2 /*return*/, writeFile(directory, executionMode, output)];
            }
            else if (executionMode === 'DailySchedule') {
                output = runDailySchedule(files, range, employeeId);
                if (output)
                    return [2 /*return*/, writeFile(directory, executionMode, output)];
            }
            else {
                console.log('Invalid Task Type.  Acceptable values are "dailyCapacity" or "dailySchedule".');
            }
            return [2 /*return*/];
        });
    });
}();
//# sourceMappingURL=capacity-analysis.js.map