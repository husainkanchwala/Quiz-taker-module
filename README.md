Quiz-taker-module
=================

module for quiz taking

specifications:

	only for MCQ
	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	redis schema:
	--------------------------------
		name : Quiz:id 
		type : LIST
		info : contains Question id's
	-------------------------------- 
		name : Question
		type : LIST
		info : contains question statements
	----------------------------------------
		name : Option:id
		type : LIST
		info : id will correspond to the number stored in Question 			LIST and it contains the option corresponding to 			that Question and the last option will be 					rudendunt one which is the solution.
	----------------------------------------------------------------	name : QuizValue
		type : Global variable
		info : contains the value alloted for the next id in Quiz:id
	----------------------------------------------------------------
		name : QuestionValue
		type : Global variable
		info : contains the value alloted for the next id in 				Option:id and Question index in Question LIST.
	----------------------------------------------------------------