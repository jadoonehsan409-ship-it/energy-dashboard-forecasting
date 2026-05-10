import { useState } from 'react';
import Layout from '../components/Layout';
import LiveGauge from '../components/LiveGauge';
import AlertBanner from '../components/AlertBanner';
import { useEnergyData } from '../hooks/useEnergyData';
import { AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts';
import { Zap,TrendingUp,TrendingDown,Calendar,DollarSign,RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const TT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="card p-2.5 text-xs"><div className="text-dim mb-1">{label}</div>{payload.map(p=>p.value!=null&&<div key={p.name} style={{color:p.color}}>{p.name}: {Number(p.value).toFixed(3)} kWh</div>)}</div>);};

function Stat({label,value,unit,sub,trend,color='#00C2FF',icon:Icon}){
  return(<div className="card"><div className="flex justify-between items-start mb-2">{Icon&&<Icon size={13} style={{color}}/>}<span className="text-xs text-dim font-medium uppercase tracking-wider">{label}</span></div><div className="flex items-baseline gap-1"><span className="font-mono text-2xl font-bold" style={{color}}>{value}</span><span className="text-xs text-dim">{unit}</span></div>{sub&&<div className="flex items-center gap-1 mt-1.5">{trend==='up'&&<TrendingUp size={10} className="text-danger"/>}{trend==='dn'&&<TrendingDown size={10} className="text-success"/>}<span className="text-xs text-dim">{sub}</span></div>}</div>);
}

export default function Home({settings}){
  const {loading,isOnline,live,todayKwh,monthKwh,lastMonthKwh,alerts,chartData,anomaly,todayCost,monthCost,rate,refetch,lastFetch,connectionStatus,errorMessage}=useEnergyData(settings);
  const [dismissed,setDismissed]=useState([]);
  const visible=alerts.filter(a=>!dismissed.includes(a.id));
  const cur=settings.currency||'PKR';
  const diff=lastMonthKwh>0?Math.round(((monthKwh-lastMonthKwh)/lastMonthKwh)*100):0;

  if(loading)return(<Layout><div className="flex items-center justify-center h-64"><div className="text-center"><div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"/><div className="text-dim text-sm">Connecting to sensor...</div>{connectionStatus==='error'&&<div className="text-xs text-danger mt-2">{errorMessage}</div>}</div></div></Layout>);

  return(
    <Layout isOnline={isOnline} alertCount={visible.length}>
      {connectionStatus==='error'&&<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-3"><div className="text-red-500 text-lg mt-0.5">⚠</div><div className="flex-1"><div className="text-sm font-medium text-red-600">Connection Error</div><div className="text-xs text-red-500/70 mt-0.5">{errorMessage}</div><button onClick={refetch} className="text-xs text-red-600 mt-2 hover:text-red-700 font-medium">Retry Connection</button></div></div>}
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="font-display text-2xl font-bold text-text">Overview</h1><p className="text-dim text-xs mt-0.5">{lastFetch?`Updated ${format(new Date(lastFetch),'HH:mm:ss')}`:'Connecting...'}</p></div>
        <button onClick={refetch} className="btn btn-sm"><RefreshCw size={12}/>Refresh</button>
      </div>

      {visible.length>0&&<div className="mb-4">{visible.map(a=><AlertBanner key={a.id} alert={a} onDismiss={id=>setDismissed(d=>[...d,id])}/>)}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="card flex flex-col items-center justify-center" style={{boxShadow:'0 0 20px rgba(0,194,255,0.1)'}}>
          <div className="text-xs text-dim uppercase tracking-wider mb-1">Live Power</div>
          <LiveGauge value={live?.power||0} max={3000} label="Watts" color={isOnline?'#00C2FF':'#EF4444'}/>
          <div className="flex items-center gap-1.5 mt-1"><span className={`pulse-dot${isOnline?'':' off'}`}/><span className="text-xs font-mono text-dim">{live?.time?format(new Date(live.time),'HH:mm:ss'):'--'}</span></div>
        </div>
        <Stat label="Today's Usage" value={todayKwh.toFixed(3)} unit="kWh" sub={`${cur} ${todayCost} est.`} icon={Zap} color="#00C2FF"/>
        <Stat label="This Month" value={monthKwh.toFixed(2)} unit="kWh" sub={diff!==0?`${diff>0?'+':''}${diff}% vs last month`:'vs last month'} trend={diff>10?'up':diff<-10?'dn':null} icon={Calendar} color={diff>10?'#EF4444':'#10B981'}/>
        <Stat label="Month Cost Est." value={monthCost} unit={cur} sub={`@ ${cur} ${rate}/kWh`} icon={DollarSign} color="#F59E0B"/>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {[{l:'Voltage',v:live?.voltage?.toFixed(1)||'--',u:'V',c:'#86EFAC'},{l:'Current',v:live?.current?.toFixed(3)||'--',u:'A',c:'#FCD34D'},{l:'Frequency',v:live?.frequency?.toFixed(1)||'--',u:'Hz',c:'#C4B5FD'},{l:'Power Factor',v:live?.powerFactor?.toFixed(3)||'--',u:'',c:'#7DD3FC'}].map(({l,v,u,c})=>(
          <div key={l} className="card text-center py-3"><div className="text-xs text-dim uppercase tracking-wider mb-1">{l}</div><div className="font-mono font-bold text-lg" style={{color:c}}>{v}</div><div className="text-xs text-muted">{u}</div></div>
        ))}
      </div>

      {live?.loadLabel&&<div className="card mb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber/20 flex items-center justify-center flex-shrink-0"><Zap size={16} className="text-amber"/></div>
        <div><div className="text-xs text-dim uppercase tracking-wider">Active Appliance</div><div className="font-display text-lg font-bold text-text">{live.loadLabel.replace(/_/g,' ')}</div></div>
        {anomaly.isAnomaly&&<div className="ml-auto text-right"><div className="text-xs text-danger font-medium">⚠ Above Normal</div><div className="text-xs text-dim">{anomaly.percentAbove}% over avg</div></div>}
      </div>}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div><div className="font-display font-semibold text-text">Daily Consumption</div><div className="text-xs text-dim mt-0.5">Last 30 days + 7-day forecast</div></div>
          <div className="flex items-center gap-3 text-xs text-dim">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent inline-block rounded"/>Actual</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber inline-block rounded"/>Forecast</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={chartData} margin={{top:5,right:8,left:-22,bottom:0}}>
            <defs>
              <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00C2FF" stopOpacity={0.3}/><stop offset="95%" stopColor="#00C2FF" stopOpacity={0}/></linearGradient>
              <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:'#4A5568',fontSize:10}} tickLine={false} tickFormatter={d=>d?d.slice(5):''} interval={4}/>
            <YAxis tick={{fill:'#4A5568',fontSize:10}} tickLine={false} axisLine={false}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="actual" stroke="#00C2FF" fill="url(#ga)" strokeWidth={2} dot={false} name="Actual" connectNulls={false}/>
            <Area type="monotone" dataKey="yhat" stroke="#F59E0B" fill="url(#gf)" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Forecast" connectNulls={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Layout>
  );
}
