import numpy as np
rng=np.random.default_rng(1)
import sys
T=10; N=200; TOK=100; STEP=int(sys.argv[1])
true=np.array([22,14,12,6,9,8,10,5,8,6],float); true/=true.sum()

def round_alloc(w,step=STEP,tok=TOK):
    units=tok//step; x=w/w.sum()*units; f=np.floor(x); r=int(units-f.sum())
    idx=np.argsort(-(x-f))[:r]; f[idx]+=1; return f*step

def sincere(cap):
    belief=rng.dirichlet(true*25)   # noisy personal belief
    w=belief.copy()
    if cap: w[np.argsort(-w)[cap:]]=0
    return round_alloc(w)

def overlap(p,c): return np.minimum(p,c).sum()

for cap in [5,4]:
    res={}
    for trial in range(150):
        votes=np.array([sincere(cap) for _ in range(N)])
        crowd=votes.sum(0)/votes.sum()*100
        scores=np.array([overlap(v,crowd) for v in votes])
        order=np.argsort(-crowd)
        k = cap or T
        strat={
          'uniform_all10': round_alloc(np.ones(T)) if not cap else None,
          'hedge_equal_topk_of_own': None,
          'sincere_typical': votes[0],
          'all_in_top1': np.eye(T)[order[0]]*100,
          'copycat_live(k)': round_alloc(np.where(np.isin(np.arange(T),order[:k]),crowd,0)),
        }
        b=rng.dirichlet(true*25); w=np.zeros(T); w[np.argsort(-b)[:k]]=1
        strat['hedge_equal_topk_of_own']=round_alloc(w)
        for name,a in strat.items():
            if a is None: continue
            s=overlap(a,crowd); pct=(scores<s).mean()*100
            res.setdefault(name,[]).append(pct)
        res.setdefault('best_sincere_score',[]).append(scores.max())
        res.setdefault('ties_at_top',[]).append((scores==scores.max()).sum())
    print('cap',cap)
    for k2,v in res.items(): print(f'  {k2:28s} mean={np.mean(v):6.1f}')
