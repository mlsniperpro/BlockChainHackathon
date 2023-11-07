let skills: String[];
skills = ['Javascript', 'Typescript', 'Angular'];

let marks:number = 70;

if(marks < 30){
    console.log("This is not a passing grade")
} else if(marks >= 30 && marks <= 50){
    console.log("This is a passing grade")
} else if(marks > 50 && marks <= 70){
    console.log("This is a good grade")
}
else if(marks > 70 && marks <= 90){
    console.log("This is a very good grade")
}
else if(marks > 90 && marks <= 100){
    console.log("This is an excellent grade")
}