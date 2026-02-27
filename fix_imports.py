import os
import glob

directory = '/media/swastik/focus/ldm feb/src/app/api'
files = glob.glob(directory + '/**/*.ts', recursive=True)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
        
    if "from '@/models/Academic'" in content and "import '@/models/Academic';" not in content:
        # replace the line explicitly
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if "from '@/models/Academic'" in line:
                new_lines.append("import '@/models/Academic';")
        with open(file, 'w') as f:
            f.write('\n'.join(new_lines))
        print(f"Fixed {file}")
