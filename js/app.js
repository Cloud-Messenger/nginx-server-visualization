(function(){
'use strict';
var IP='3.110.45.27';
var N={b:[20,'Browser','Visitor'],i:[190,'Internet','Public routing'],g:[360,'Security Group','Firewall rules'],n:[530,'NGINX','Port 80'],f:[710,'/usr/share/nginx/html','index.html css js images']};
var cx=function(k){return N[k][0]+(k==='f'?100:65)};
var S=[
{t:'AWS EC2',on:['n'],l:'Launching the virtual server',s:'EC2 is a computer you rent from AWS. We start one that will host our website.',x:'Launch an Amazon Linux 2023 instance (t2.micro/t3.micro), choose a key pair, and place it in a public subnet with a public IPv4 address.',c:['$ aws ec2 run-instances --image-id <AL2023-AMI> \\','  --instance-type t3.micro --key-name mykey','State: pending -> running']},
{t:'Security Group',on:['g'],l:'Port 80 open to all, port 22 only to my IP',s:'A security group is a doorman. Only the doors you open let visitors in.',x:'Stateful virtual firewall at the ENI level. Inbound: TCP 80 from 0.0.0.0/0, TCP 22 from <your-IP>/32. All outbound allowed. Return traffic is automatically allowed.',c:['Inbound rules','HTTP  TCP 80  0.0.0.0/0      ALLOW','SSH   TCP 22  203.0.113.5/32  ALLOW'],chk:1},
{t:'Connect to EC2',on:['b','n'],pk:['b','n'],l:'SSH session on port 22',s:'SSH is a secure remote control. You type commands on your laptop; they run on the server.',x:'SSH uses key-pair authentication over TCP 22. Default user on Amazon Linux is ec2-user.',c:['$ chmod 400 mykey.pem','$ ssh -i mykey.pem ec2-user@'+IP,'[ec2-user@ip-172-31-5-10 ~]$']},
{t:'Install NGINX',on:['n'],l:'Installing the web server',s:'NGINX is the program that listens for visitors and hands out web pages.',x:'dnf is the package manager on AL2023. It downloads nginx and its dependencies and registers a systemd unit.',c:['$ sudo dnf install nginx -y','Installing: nginx','Complete!']},
{t:'Start NGINX',on:['n'],l:'systemctl enable --now nginx',s:'Start it now, and make sure it starts again after every reboot.',x:'systemd runs nginx as a service. enable creates the boot symlink; --now starts it immediately. nginx listens on 0.0.0.0:80.',c:['$ sudo systemctl enable --now nginx','$ systemctl status nginx','Active: active (running)']},
{t:'Website Files',on:['n','f'],l:'Copying site files into the web root',s:'The website is just files in a folder. NGINX serves whatever is in that folder.',x:'Default docroot is /usr/share/nginx/html. Copy index.html, css/, js/ and images there; ensure files are readable by the nginx user.',c:['$ sudo cp -r site/* /usr/share/nginx/html/','$ ls /usr/share/nginx/html','index.html css js assets']},
{t:'Browser Request',on:['b','i','g','n'],pk:['b','n'],l:'GET / HTTP/1.1',s:'You type the server address. Your browser knocks on the door and asks for the page.',x:'Browser opens a TCP connection to the public IP on port 80, sends GET /. The Internet Gateway translates to the private IP; the security group allows inbound 80.',c:['GET / HTTP/1.1','Host: '+IP,'Accept: text/html'],url:'http://'+IP,load:1},
{t:'NGINX Response',on:['n','f','g','i','b'],pk:['n','b'],res:1,l:'200 OK + index.html, css, js, images',s:'NGINX fetches the files and sends them back. Your browser builds the page.',x:'NGINX maps / to index.html, replies 200 OK with Content-Type headers. The browser then requests the CSS, JS and image files the same way.',c:['HTTP/1.1 200 OK','Content-Type: text/html','Server: nginx'],url:'http://'+IP,show:1},
{t:'Troubleshooting',on:['g','n'],l:'Check in this order',s:'Page not loading? Check the usual suspects one by one.',x:'1) Security group allows port 80. 2) Service is running. 3) Using the current public IP. 4) curl localhost works, so the problem is network, not NGINX.',c:['$ sudo systemctl status nginx','$ sudo ss -tlnp | grep :80','$ curl http://localhost','<title>Streamly</title>  OK'],url:'http://'+IP,show:1}
];
var $=function(i){return document.getElementById(i)};
var cur=0,playing=true,tm=null,raf=0,typing=0;
var dia=$('dia'),h='<line class="ln" x1="85" y1="125" x2="810" y2="125"/>';
Object.keys(N).forEach(function(k){var n=N[k],w=k==='f'?200:130;h+='<g class="nd" id="n_'+k+'"><rect x="'+n[0]+'" y="90" width="'+w+'" height="70" rx="8"/><text x="'+(n[0]+w/2)+'" y="122" style="font-weight:700">'+n[1]+'</text><text x="'+(n[0]+w/2)+'" y="142">'+n[2]+'</text></g>'});
h+='<text id="lbl" x="470" y="40"></text><g id="chk"></g><circle id="pk" class="pk" r="9" cx="-20" cy="125"/><text id="doc" x="0" y="80" font-size="18" opacity="0">&#128196;</text>';
dia.innerHTML=h;
var cols=[['#e50914','#5a0a10'],['#2b5fd9','#101c4a'],['#16a085','#0b3b33'],['#f39c12','#6b3d05'],['#8e44ad','#3a1650'],['#c0392b','#3a0f0b']],names=['Night Run','Cloud Heist','The Server','Ping','Edge Case','Uptime'];
names.forEach(function(n,i){var d=document.createElement('div');d.className='poster';d.textContent=n;d.style.background='linear-gradient(160deg,'+cols[i][0]+','+cols[i][1]+')';$('row').appendChild(d)});
var ol=$('steps');
S.forEach(function(s,i){var li=document.createElement('li');li.tabIndex=0;li.innerHTML='<b>'+(i+1)+'</b><span>'+s.t+'</span>';li.onclick=function(){go(i)};li.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(i)}};ol.appendChild(li)});
function type(lines){clearInterval(typing);var el=$('term'),txt=lines.join('\n'),i=0;el.textContent='';typing=setInterval(function(){el.textContent=txt.slice(0,++i);if(i>=txt.length)clearInterval(typing)},22)}
function fly(a,b,res){cancelAnimationFrame(raf);var p=$('pk'),d=$('doc'),x1=cx(a),x2=cx(b),st=performance.now(),dur=2200;
p.setAttribute('class','pk'+(res?' res':''));
(function f(now){var u=((now-st)%dur)/dur,x=x1+(x2-x1)*u;p.setAttribute('cx',x);d.setAttribute('x',x-9);d.setAttribute('opacity',res?1:0);raf=requestAnimationFrame(f)})(st)}
function go(i){
cur=i;S.forEach(function(_,k){ol.children[k].className=k===i?'on':(k<i?'done':'')});
var s=S[i];$('ct').textContent=(i+1)+'. '+s.t;$('cs').textContent=s.s;$('cx').textContent=s.x;type(s.c);
Object.keys(N).forEach(function(k){$('n_'+k).setAttribute('class','nd'+(s.on.indexOf(k)>-1?' on':''))});
$('lbl').textContent=s.l;cancelAnimationFrame(raf);$('pk').setAttribute('cx',-20);$('doc').setAttribute('opacity',0);
$('chk').innerHTML=s.chk?'<text x="425" y="75" fill="#46d369" font-size="13" text-anchor="middle">&#10003; 80 HTTP  &#10003; 22 SSH</text><text x="425" y="190" fill="#e50914" font-size="13" text-anchor="middle">&#10007; all other ports blocked</text>':'';
if(s.pk)fly(s.pk[0],s.pk[1],s.res);
$('url').textContent=s.url||'about:blank';
var show=!!s.show;$('site').className='site'+(show?'':' off');$('ov').className='ov'+(show?' hide':'');
$('ov').textContent=s.load?'Loading...':(i===5?'Files in place, no request yet':'Not served yet');
var pr=$('prog');pr.style.transition='none';pr.style.width='0';void pr.offsetWidth;
clearTimeout(tm);if(playing){pr.style.transition='width 5s linear';pr.style.width='100%';tm=setTimeout(function(){go((cur+1)%S.length)},5000)}
}
$('play').onclick=function(){playing=!playing;this.textContent=playing?'Pause':'Play';go(cur)};
$('reset').onclick=function(){playing=true;$('play').textContent='Pause';go(0)};
$('theme').onclick=function(){var d=document.documentElement,dark=d.getAttribute('data-theme')==='dark';d.setAttribute('data-theme',dark?'light':'dark');this.textContent=dark?'Dark mode':'Light mode'};
go(0);
})();
