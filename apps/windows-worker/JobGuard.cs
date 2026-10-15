using System;
using System.Runtime.InteropServices;
public static class JobGuard {
  [StructLayout(LayoutKind.Sequential)] struct Basic {public long ProcessTime,JobTime;public uint Flags;public UIntPtr MinWorking,MaxWorking;public uint Processes;public UIntPtr Affinity;public uint Priority,Scheduling;}
  [StructLayout(LayoutKind.Sequential)] struct IO {public ulong ReadOps,WriteOps,OtherOps,ReadBytes,WriteBytes,OtherBytes;}
  [StructLayout(LayoutKind.Sequential)] struct Limits {public Basic Basic;public IO IO;public UIntPtr ProcessMemory,JobMemory,PeakProcess,PeakJob;}
  [StructLayout(LayoutKind.Sequential)] struct CPU {public uint Flags,Rate;}
  [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] static extern IntPtr CreateJobObject(IntPtr attributes,string name);
  [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr OpenProcess(uint rights,bool inherit,uint id);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job,int kind,IntPtr info,uint bytes);
  [DllImport("kernel32.dll",SetLastError=true)] static extern bool QueryInformationJobObject(IntPtr job,int kind,IntPtr info,uint bytes,IntPtr returned);
  [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr handle,uint timeout);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  static void Set<T>(IntPtr job,int kind,T value){IntPtr memory=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(T)));try{Marshal.StructureToPtr(value,memory,false);if(!SetInformationJobObject(job,kind,memory,(uint)Marshal.SizeOf(typeof(T))))throw new Exception("Windows job limit rejected: "+Marshal.GetLastWin32Error());}finally{Marshal.FreeHGlobal(memory);}}
  static T Get<T>(IntPtr job,int kind){IntPtr memory=Marshal.AllocHGlobal(Marshal.SizeOf(typeof(T)));try{if(!QueryInformationJobObject(job,kind,memory,(uint)Marshal.SizeOf(typeof(T)),IntPtr.Zero))throw new Exception("Windows job query failed");return (T)Marshal.PtrToStructure(memory,typeof(T));}finally{Marshal.FreeHGlobal(memory);}}
  public static int Main(string[] args){IntPtr job=IntPtr.Zero,process=IntPtr.Zero;try{
    uint pid,cpu,memory;if(args.Length!=3||!UInt32.TryParse(args[0],out pid)||pid==0||!UInt32.TryParse(args[1],out cpu)||cpu<1||cpu>100||!UInt32.TryParse(args[2],out memory)||memory<64||memory>4096)throw new Exception("Invalid owned worker limits");
    job=CreateJobObject(IntPtr.Zero,null);if(job==IntPtr.Zero)throw new Exception("Windows job unavailable");
    Limits limits=new Limits();limits.Basic.Flags=0x2300;limits.ProcessMemory=new UIntPtr((ulong)memory*1024*1024);limits.JobMemory=limits.ProcessMemory;Set(job,9,limits);CPU rate=new CPU();rate.Flags=5;rate.Rate=cpu*100;Set(job,15,rate);
    process=OpenProcess(0x00100101,false,pid);if(process==IntPtr.Zero||!AssignProcessToJobObject(job,process))throw new Exception("Owned worker job assignment failed: "+Marshal.GetLastWin32Error());
    Limits actual=Get<Limits>(job,9);CPU actualCpu=Get<CPU>(job,15);
    Console.WriteLine("{\"cpuRate\":"+actualCpu.Rate+",\"memoryBytes\":"+actual.JobMemory.ToUInt64()+",\"killOnClose\":"+((actual.Basic.Flags&0x2000)!=0?"true":"false")+"}");Console.Out.Flush();
    if(WaitForSingleObject(process,0xffffffff)!=0)throw new Exception("Owned worker wait failed");return 0;
  }catch(Exception error){Console.Error.WriteLine(error.Message);return 2;}finally{if(process!=IntPtr.Zero)CloseHandle(process);if(job!=IntPtr.Zero)CloseHandle(job);}}
}
