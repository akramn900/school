-- SchoolMS demo data for Supabase
-- Run after supabase-schema.sql.

truncate table
  public.attendance,
  public.results,
  public.assignments,
  public.exams,
  public.lessons,
  public.announcements,
  public.events,
  public.students,
  public.classes,
  public.subjects,
  public.teachers,
  public.parents,
  public.grades,
  public.admins
restart identity;

insert into public.admins (id, username, password) values
  ('admin-1', 'admin', 'admin123');

insert into public.grades (id, level) values
  ('1',1),('2',2),('3',3),('4',4),('5',5),('6',6);

insert into public.parents (id, username, password, name, surname, email, phone, address) values
  ('parent-1','parent1','parent123','Aisha','Khan','aisha.khan@example.com','555-0101','12 Maple Street'),
  ('parent-2','parent2','parent123','Rahul','Mehta','rahul.mehta@example.com','555-0102','45 Lake View Road'),
  ('parent-3','parent3','parent123','Sarah','Thomas','sarah.thomas@example.com','555-0103','78 Park Avenue'),
  ('parent-4','parent4','parent123','Omar','Ali','omar.ali@example.com','555-0104','9 Green Lane'),
  ('parent-5','parent5','parent123','Priya','Nair','priya.nair@example.com','555-0105','31 River Road');

insert into public.teachers (id, username, password, name, surname, email, phone, address, "bloodType", sex, birthday) values
  ('teacher-1','teacher1','teacher123','Maria','Thomas','maria.thomas@example.com','555-0201','21 Oak Street','O+','FEMALE','1988-04-12'),
  ('teacher-2','teacher2','teacher123','James','Wilson','james.wilson@example.com','555-0202','34 Pine Avenue','A+','MALE','1984-08-04'),
  ('teacher-3','teacher3','teacher123','Sophia','Reed','sophia.reed@example.com','555-0203','56 Cedar Lane','B+','FEMALE','1990-11-20'),
  ('teacher-4','teacher4','teacher123','Arjun','Patel','arjun.patel@example.com','555-0204','8 Sunset Drive','AB+','MALE','1986-02-18'),
  ('teacher-5','teacher5','teacher123','Nina','Garcia','nina.garcia@example.com','555-0205','19 Hill Road','O-','FEMALE','1992-06-06');

insert into public.subjects (id, name) values
  ('subject-1','Mathematics'),
  ('subject-2','English'),
  ('subject-3','Science'),
  ('subject-4','Social Studies'),
  ('subject-5','Computer Science'),
  ('subject-6','Art'),
  ('subject-7','Physical Education');

insert into public.classes (id, name, capacity, "gradeId", "supervisorId") values
  ('class-1','Grade 1A',30,'1','teacher-1'),
  ('class-2','Grade 2A',28,'2','teacher-2'),
  ('class-3','Grade 3A',32,'3','teacher-3'),
  ('class-4','Grade 4A',30,'4','teacher-4'),
  ('class-5','Grade 5A',26,'5','teacher-5');

insert into public.students (id, username, password, name, surname, email, phone, address, "bloodType", sex, birthday, "gradeId", "classId", "parentId") values
  ('student-1','student1','student123','Liam','Khan','student1@student.example.com','','Student family address','O+','MALE','2018-05-10','1','class-1','parent-1'),
  ('student-2','student2','student123','Emma','Khan','student2@student.example.com','','Student family address','A+','FEMALE','2018-07-13','1','class-1','parent-1'),
  ('student-3','student3','student123','Noah','Mehta','student3@student.example.com','','Student family address','B+','MALE','2017-01-18','2','class-2','parent-2'),
  ('student-4','student4','student123','Ava','Thomas','student4@student.example.com','','Student family address','AB+','FEMALE','2017-09-21','2','class-2','parent-3'),
  ('student-5','student5','student123','Ethan','Ali','student5@student.example.com','','Student family address','O+','MALE','2016-03-11','3','class-3','parent-4'),
  ('student-6','student6','student123','Mia','Nair','student6@student.example.com','','Student family address','A-','FEMALE','2016-11-30','3','class-3','parent-5'),
  ('student-7','student7','student123','Lucas','Mehta','student7@student.example.com','','Student family address','B-','MALE','2015-06-02','4','class-4','parent-2'),
  ('student-8','student8','student123','Zara','Ali','student8@student.example.com','','Student family address','O-','FEMALE','2015-08-22','4','class-4','parent-4'),
  ('student-9','student9','student123','Aria','Thomas','student9@student.example.com','','Student family address','AB-','FEMALE','2014-12-04','5','class-5','parent-3'),
  ('student-10','student10','student123','Kabir','Nair','student10@student.example.com','','Student family address','O+','MALE','2014-02-16','5','class-5','parent-5');

insert into public.lessons (id, name, day, "startTime", "endTime", "subjectId", "classId", "teacherId") values
  ('lesson-1','Math Basics','MONDAY','08:30','09:20','subject-1','class-1','teacher-1'),
  ('lesson-2','English Reading','TUESDAY','09:30','10:20','subject-2','class-1','teacher-2'),
  ('lesson-3','Science Lab','MONDAY','10:30','11:20','subject-3','class-2','teacher-3'),
  ('lesson-4','World Around Us','WEDNESDAY','08:30','09:20','subject-4','class-2','teacher-4'),
  ('lesson-5','Computer Skills','THURSDAY','11:30','12:20','subject-5','class-3','teacher-5'),
  ('lesson-6','Art Studio','FRIDAY','10:30','11:20','subject-6','class-3','teacher-1'),
  ('lesson-7','Advanced Math','TUESDAY','08:30','09:20','subject-1','class-4','teacher-1'),
  ('lesson-8','PE Session','FRIDAY','09:30','10:20','subject-7','class-5','teacher-4');

insert into public.exams (id, title, "startTime", "endTime", "lessonId") values
  ('exam-1','Math Unit Test', now() + interval '7 days', now() + interval '7 days 1 hour','lesson-1'),
  ('exam-2','English Reading Quiz', now() + interval '9 days', now() + interval '9 days 1 hour','lesson-2'),
  ('exam-3','Science Midterm', now() + interval '12 days', now() + interval '12 days 1 hour','lesson-3'),
  ('exam-4','Computer Practical', now() + interval '15 days', now() + interval '15 days 1 hour','lesson-5');

insert into public.assignments (id, title, "startDate", "dueDate", "lessonId") values
  ('assignment-1','Math Worksheet 1', current_date - 3, current_date + 3,'lesson-1'),
  ('assignment-2','Reading Log', current_date - 2, current_date + 4,'lesson-2'),
  ('assignment-3','Science Observation', current_date - 1, current_date + 5,'lesson-3'),
  ('assignment-4','Computer Poster', current_date, current_date + 6,'lesson-5');

insert into public.results (id, score, "examId", "assignmentId", "studentId") values
  ('result-1',91,'exam-1',null,'student-1'),
  ('result-2',86,'exam-2',null,'student-2'),
  ('result-3',79,'exam-3',null,'student-3'),
  ('result-4',93,'exam-4',null,'student-4'),
  ('result-5',74,'exam-1',null,'student-5'),
  ('result-6',88,'exam-2',null,'student-6'),
  ('result-7',81,'exam-3',null,'student-7'),
  ('result-8',95,'exam-4',null,'student-8');

insert into public.attendance (id, date, present, "studentId", "lessonId") values
  ('att-1',current_date - 2,true,'student-1','lesson-1'),
  ('att-2',current_date - 2,true,'student-2','lesson-2'),
  ('att-3',current_date - 2,false,'student-3','lesson-3'),
  ('att-4',current_date - 1,true,'student-4','lesson-4'),
  ('att-5',current_date - 1,true,'student-5','lesson-5'),
  ('att-6',current_date - 1,true,'student-6','lesson-6'),
  ('att-7',current_date,true,'student-7','lesson-7'),
  ('att-8',current_date,false,'student-8','lesson-8');

insert into public.events (id, title, description, "startTime", "endTime", "classId") values
  ('event-1','Parent Teacher Meeting','Meet class supervisors and discuss progress.',now() + interval '5 days',now() + interval '5 days 3 hours',null),
  ('event-2','Science Fair','Student projects and demonstrations.',now() + interval '10 days',now() + interval '10 days 6 hours',null),
  ('event-3','Sports Day','Track, games, and house competitions.',now() + interval '18 days',now() + interval '18 days 6 hours',null);

insert into public.announcements (id, title, description, date, "classId") values
  ('ann-1','Welcome to the new term','Classes and schedules are now available.',current_date,null),
  ('ann-2','Uniform reminder','Please follow the summer uniform guidelines.',current_date + 1,null),
  ('ann-3','Library week','Book reading activities begin next Monday.',current_date + 2,null);
