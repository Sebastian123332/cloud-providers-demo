import json,sys,math
g=json.load(open(sys.argv[1])); out=sys.argv[2]
LON0,LAT0=-86.0,11.25; K=172; C=math.cos(math.radians(9.8))
P=lambda lo,la:((lo-LON0)*C*K+14,(LAT0-la)*K+14)
def area(r): return 0.5*sum(r[i][0]*r[i-1][1]-r[i-1][0]*r[i][1] for i in range(len(r)))
def dp(pts,tol):
    if len(pts)<3: return pts
    a,b=pts[0],pts[-1]; dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy) or 1e-9
    i,dm=0,0
    for k in range(1,len(pts)-1):
        p=pts[k]; d=abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L if L>1e-9 else math.hypot(p[0]-a[0],p[1]-a[1])
        if d>dm: i,dm=k,d
    if dm>tol: return dp(pts[:i+1],tol)[:-1]+dp(pts[i:],tol)
    return [a,b]
def cent(r):
    A=-area(r); cx=cy=0
    for i in range(len(r)):
        x0,y0=r[i-1]; x1,y1=r[i]; f=x0*y1-x1*y0; cx+=(x0+x1)*f; cy+=(y0+y1)*f
    return cx/(6*A),cy/(6*A)
res={}
for f in g['features']:
    n=f['properties']['shapeName'].replace('Provincia ','')
    polys=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]
    d=[]; big=None
    for poly in polys:
        r=[P(*c[:2]) for c in poly[0]]
        if abs(area(r))<6 or r[0][0]<0: continue
        if big is None or abs(area(r))>abs(area(big)): big=r
        s=dp(r,.6)
        d.append('M'+' L'.join('%.1f %.1f'%p for p in s[:-1])+'Z')
    res[n]={'d':''.join(d),'c':cent(big)}
    print(n,len(res[n]['d']),'%.0f %.0f'%res[n]['c'])
json.dump(res,open(out,'w'),ensure_ascii=False)
xs=[]
