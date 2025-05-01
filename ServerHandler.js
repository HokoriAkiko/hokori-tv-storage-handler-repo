import os from "os";
import { exec } from "child_process";
import util from "util";

const exec_promise = util.promisify(exec);

export const handle_server_health = async (req,res)=>{
    const get_instance = ()=>{
        const cpus = os.cpus();
        return cpus.map((cpu)=>{
            const { user, nice, sys, idle, irq } = cpu.times;
            const total = user + nice + sys + idle + irq;
            return {idle,total}
        })
    }
    const get_disk_load = async ()=>{
        const { stdout } = await exec_promise(`powershell "Get-Counter '\\PhysicalDisk(_Total)\\% Disk Time'"`);
        const match = stdout.match(/:\s+(\d+(\.\d+)?)/);
        return !!match[1] ? parseFloat(match[1]): 0;
    }

    const disk_time_percent = await get_disk_load();
    const old = get_instance();

    setTimeout(() => {
        const temp = get_instance();
        const usage = temp.map((v,i)=> Math.round((100 - 100*(v.idle - old[i].idle)/(v.total - old[i].total))))
        const avg = Math.round(usage.reduce((a,b)=>a+b) / usage.length);

        const data = {
            cpu_load : avg,
            total_memory : os.totalmem(),
            free_memory: os.freemem(),
            up_time: os.uptime(),
            cpu_count: os.cpus().length,
            disk_time_percent
        }

        res.send({result : data});
    }, 500);
}