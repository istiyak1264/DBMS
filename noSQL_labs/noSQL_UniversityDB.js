use("UniversityDB");

db.dropDatabase();

db.departments.insertMany([
{ dept_name: "Comp. Sci.", building: "Taylor", budget: 100000 },
{ dept_name: "Biology", building: "Watson", budget: 90000 },
{ dept_name: "Finance", building: "Painter", budget: 120000 },
{ dept_name: "History", building: "King", budget: 60000 }
]);

db.instructors.insertMany([
{ _id: "10101", name: "Srinivasan", dept_name: "Comp. Sci.", salary: 65000 },
{ _id: "12121", name: "Wu", dept_name: "Finance", salary: 90000 },
{ _id: "22222", name: "Einstein", dept_name: "History", salary: 95000 },
{ _id: "32343", name: "El Said", dept_name: "History", salary: 60000 },
{ _id: "83821", name: "Brandt", dept_name: "Comp. Sci.", salary: 92000 }
]);

db.students.insertMany([
{ _id: "00128", name: "Zhang", dept_name: "Comp. Sci.", tot_cred: 102 },
{ _id: "12345", name: "Shankar", dept_name: "Comp. Sci.", tot_cred: 32 },
{ _id: "54321", name: "Williams", dept_name: "Comp. Sci.", tot_cred: 54 },
{ _id: "76543", name: "Brown", dept_name: "Comp. Sci.", tot_cred: 58 },
{ _id: "98988", name: "Tanaka", dept_name: "Biology", tot_cred: 120 }
]);

db.courses.insertMany([
{ course_id: "CS-101", title: "Intro to CS", dept_name: "Comp. Sci.", credits: 4 },
{ course_id: "CS-315", title: "Robotics", dept_name: "Comp. Sci.", credits: 3 },
{ course_id: "CS-347", title: "DB Systems", dept_name: "Comp. Sci.", credits: 3 },
{ course_id: "BIO-101", title: "Intro to Biology", dept_name: "Biology", credits: 3 }
]);

print("UniversityDB created successfully!");
