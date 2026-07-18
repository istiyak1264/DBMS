#!/bin/bash

mysql -u root -p <<EOF

DROP DATABASE IF EXISTS UniversityDB;
CREATE DATABASE UniversityDB;
USE UniversityDB;

DROP TABLE IF EXISTS prereq;
DROP TABLE IF EXISTS advisor;
DROP TABLE IF EXISTS takes;
DROP TABLE IF EXISTS teaches;
DROP TABLE IF EXISTS section;
DROP TABLE IF EXISTS course;
DROP TABLE IF EXISTS instructor;
DROP TABLE IF EXISTS student;
DROP TABLE IF EXISTS department;

CREATE TABLE department (
    dept_name VARCHAR(20) PRIMARY KEY,
    building VARCHAR(15),
    budget NUMERIC(12,2)
);

CREATE TABLE instructor (
    ID VARCHAR(5) PRIMARY KEY,
    name VARCHAR(20),
    dept_name VARCHAR(20),
    salary NUMERIC(8,2),
    FOREIGN KEY (dept_name) REFERENCES department(dept_name)
);

CREATE TABLE student (
    ID VARCHAR(5) PRIMARY KEY,
    name VARCHAR(20),
    dept_name VARCHAR(20),
    tot_cred NUMERIC(3,0),
    FOREIGN KEY (dept_name) REFERENCES department(dept_name)
);

CREATE TABLE course (
    course_id VARCHAR(8) PRIMARY KEY,
    title VARCHAR(50),
    dept_name VARCHAR(20),
    credits NUMERIC(2,0),
    FOREIGN KEY (dept_name) REFERENCES department(dept_name)
);

CREATE TABLE section (
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4,0),
    building VARCHAR(15),
    room_number VARCHAR(7),
    time_slot_id VARCHAR(4),
    PRIMARY KEY (course_id, sec_id, semester, year),
    FOREIGN KEY (course_id) REFERENCES course(course_id)
);

CREATE TABLE teaches (
    ID VARCHAR(5),
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4,0),
    PRIMARY KEY (ID, course_id, sec_id, semester, year),
    FOREIGN KEY (ID) REFERENCES instructor(ID),
    FOREIGN KEY (course_id, sec_id, semester, year)
        REFERENCES section(course_id, sec_id, semester, year)
);

CREATE TABLE takes (
    ID VARCHAR(5),
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4,0),
    grade VARCHAR(2),
    PRIMARY KEY (ID, course_id, sec_id, semester, year),
    FOREIGN KEY (ID) REFERENCES student(ID),
    FOREIGN KEY (course_id, sec_id, semester, year)
        REFERENCES section(course_id, sec_id, semester, year)
);

CREATE TABLE advisor (
    s_ID VARCHAR(5),
    i_ID VARCHAR(5),
    PRIMARY KEY (s_ID)
);

CREATE TABLE prereq (
    course_id VARCHAR(8),
    prereq_id VARCHAR(8),
    PRIMARY KEY (course_id, prereq_id)
);

INSERT INTO department VALUES
('Comp. Sci.','Taylor',100000),
('Biology','Watson',90000),
('Elec. Eng.','Taylor',85000),
('History','Painter',50000),
('Finance','Painter',120000),
('Physics','Newton',110000),
('Music','Arts',70000);

INSERT INTO instructor VALUES
('10101','Srinivasan','Comp. Sci.',65000),
('12121','Wu','Finance',90000),
('22222','Einstein','Physics',95000),
('32343','El Said','History',60000),
('45565','Katz','Comp. Sci.',75000),
('58583','Califieri','History',62000),
('76543','Singh','Finance',80000),
('98345','Kim','Elec. Eng.',80000);

INSERT INTO student VALUES
('00128','Zhang','Comp. Sci.',102),
('12345','Shankar','Comp. Sci.',32),
('54321','Williams','Comp. Sci.',54),
('76543','Brown','Comp. Sci.',58),
('98988','Tanaka','Biology',120);

INSERT INTO course VALUES
('CS-101','Intro to CS','Comp. Sci.',4),
('CS-315','Robotics','Comp. Sci.',3),
('CS-347','Db Systems','Comp. Sci.',3),
('EE-181','Intro to Digital Systems','Elec. Eng.',3),
('BIO-101','Intro to Bio','Biology',3),
('HIS-351','World History','History',3);

INSERT INTO section VALUES
('CS-101','1','Fall',2024,'Taylor','3128','A'),
('CS-347','1','Fall',2024,'Taylor','3128','A'),
('CS-101','1','Spring',2025,'Packard','101','B'),
('CS-315','1','Spring',2025,'Taylor','3128','B'),
('BIO-101','1','Summer',2025,'Painter','514','C');

INSERT INTO teaches VALUES
('10101','CS-101','1','Fall',2024),
('10101','CS-347','1','Fall',2024),
('10101','CS-101','1','Spring',2025),
('45565','CS-315','1','Spring',2025);

INSERT INTO takes VALUES
('00128','CS-101','1','Fall',2024,'A'),
('00128','CS-347','1','Fall',2024,'A-'),
('12345','CS-101','1','Fall',2024,'C'),
('54321','CS-101','1','Fall',2024,'A'),
('54321','CS-315','1','Spring',2025,'B'),
('76543','CS-101','1','Fall',2024,NULL);

EOF

echo "UniversityDB created successfully!"
