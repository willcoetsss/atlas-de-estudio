import os
S='/home/claude/geo/src/'
order=['core','explore','carto','quiz','phys','progress','trivia','main']
js='\n'.join(open(S+'js/'+n+'.js').read() for n in order if os.path.exists(S+'js/'+n+'.js'))
html=open(S+'index.html').read().replace('/*{{JS}}*/',js).replace('{{LOGO}}','<img src="icons/logo-512.png" alt="">')
open('/home/claude/geo/out/index.html','w').write(html)
print('index.html',len(html)//1024,'KB')
