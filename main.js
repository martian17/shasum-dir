const fs = require("fs");
const childProcess = require("child_process");
const path = require("path");

let exec = function(cmd,input){
    return new Promise((res,rej)=>{
        const child = childProcess.exec(cmd,(err, stdout, stderr)=>{
            if(err){
                rej(err);
            }else{
                if(stderr){
                    console.log(stderr);
                }
                res(stdout);
            }
        });
        if(input){
            child.stdin.write(input);
            child.stdin.end();
        }
    });
};

let fsReadAccess = function(name){
    return new Promise((res,rej)=>{
        fs.access(name, fs.constants.R_OK, (err) => {
            res(!err);
        });
    });
};


let calcShaSum = async function(dirname){
    console.log(`got ${dirname}`);
    //check if directory
    if(!fs.existsSync(dirname))
        throw new Error(`file ${dirname} does not exist`);
    if(!(await fsReadAccess(dirname)))
        throw new Error(`no read permission file ${dirname}`);

    let stats = fs.lstatSync(dirname);
    let sum = (await exec(`sha1sum`,dirname)).slice(0,40);
    if(stats.isFile()){
        sum += (await exec(`sha1sum ${dirname}`)).slice(0,40);
    }else if(stats.isDirectory()){
        let subs = fs.readdirSync(dirname).map(s=>path.join(dirname,s));
        for(let i = 0; i < subs.length; i++){
            let sub = subs[i];
            sum += await calcShaSum(sub);
        }
    }else{
        throw new Error(`unexpected file type ${dirname}`);
    }
    //console.log(sum);
    return (await exec(`sha1sum`,sum)).slice(0,40);
};

let main = async function(argv){
    let target = argv[2];
    if(!target)throw new Error("procide target directory to the first argument");
    //let cmd = argv[3];
    //if(!cmd)throw new Error("provide command as second argument");
    let result = await calcShaSum(target);
    console.log(result);
};

main(process.argv);