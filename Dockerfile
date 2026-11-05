FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html 404.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY img /usr/share/nginx/html/img
COPY explosom /usr/share/nginx/html/explosom
COPY stillo /usr/share/nginx/html/stillo
COPY kelly /usr/share/nginx/html/kelly
COPY broetto /usr/share/nginx/html/broetto
COPY clubedacerveja /usr/share/nginx/html/clubedacerveja
EXPOSE 80
