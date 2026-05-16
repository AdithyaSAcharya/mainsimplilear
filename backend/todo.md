todo now :-
so we have tables for the users ,courses in mysql and courses auth apis and create instructor apis are done.

so next we will have to work on these things 

MVP:
There will be investors they will have courses courses will have lessions 
and users/students can enroll to the courses and see all the lessions 
and they can actually toggle the comoleted for each lession and also we need to have the completed for the course when the all the lessions are completed in a course.


tables :
we need to have these tables 
course table already have the column to add in the mongo db url 
that is we need to store the lession in mongo so it will have the title description and content (content will have proper rich text ) and that will be referenced in the course table .
and courses table will have another column called lessions there we will have all the lessions of the course with proper line that is first lession of course will be first inside and array so that searchhing would be easy for the lessions of the course.

then we will have another table for enrollment
where we will have the thing we need to have user id and course id id 

track table to track the tings of the lession 
lessions track tat is we need to have this lessiontrack :[{lessoin_id: status_of_lession}]



