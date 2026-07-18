#!/bin/bash

mysql -u root -p <<EOF

DROP DATABASE IF EXISTS UniversityDB;
CREATE DATABASE UniversityDB;
USE UniversityDB;

DROP TRIGGER IF EXISTS update_tot_cred;
DROP TRIGGER IF EXISTS check_salary;

DROP PROCEDURE IF EXISTS register_student;
DROP PROCEDURE IF EXISTS get_dept_instructors;

DROP TABLE IF EXISTS takes;
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
    tot_cred NUMERIC(3,0) DEFAULT 0,
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
    PRIMARY KEY (course_id, sec_id, semester, year),
    FOREIGN KEY (course_id) REFERENCES course(course_id)
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

INSERT INTO department VALUES
('Comp. Sci.','Taylor',100000),
('Biology','Watson',90000);

INSERT INTO instructor VALUES
('10101','Srinivasan','Comp. Sci.',65000),
('22222','Einstein','Biology',95000);

INSERT INTO course VALUES
('CS-101','Intro to CS','Comp. Sci.',4),
('CS-315','Robotics','Comp. Sci.',3),
('BIO-101','Intro to Bio','Biology',3);

INSERT INTO section VALUES
('CS-101','1','Fall',2024),
('CS-315','1','Spring',2025);

INSERT INTO student VALUES
('00128','Zhang','Comp. Sci.',0),
('12345','Shankar','Comp. Sci.',0);

EOF

echo "UniversityDB created successfully!"
