cd ..
git clone https://github.com/eguneys/blah
cd blah
pnpm install
pnpm build
pnpm link --dir ./ --global
cd ..
git clone https://github.com/eguneys/lsolitaire
cd lsolitaire
pnpm install
pnpm build
pnpm link --dir ./ --global
cd ..
git clone https://github.com/eguneys/aset
cd aset
pnpm install
pnpm bundle
pnpm link --dir ./ --global
cd ..
