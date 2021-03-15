echo -n "Project name: "
read name

PS3="Choose a template number: "
options=(widget)
select template in "${options[@]}";
do
  echo -e "you picked $template ($REPLY)"
  if [ "$template" == "widget" ]
  then
    echo -e "Init new project $name with template $template"
    break;
  else
    echo "Wrong number"
  fi
done

git clone git@github.com:valentinMachado/UD-Viz-demo-scaffold.git

mkdir ""$name

cd "UD-Viz-demo-scaffold/$template"
mv * "../../"$name
cd ../../
rm -rf UD-Viz-demo-scaffold/

cd ""$name
npm i
npm run debug
