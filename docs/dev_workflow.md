Perfect! Here's your **regular workflow after each code change** as the Mapsi developer:

---

## **Developer Workflow (After Each Code Change)**

### **Step 1: Check What Changed**
```bash
cd ~/map_integration/magnetrock

# See what files you modified
git status

# See the actual changes (optional)
git diff
```

---

### **Step 2: Stage Your Changes**
```bash
# Add all changed files
git add .

# OR add specific files only
git add src/components/MapDisplay.jsx
git add public/styles.css

# Verify what's staged
git status
```

---

### **Step 3: Commit with Clear Message**
```bash
# Commit with descriptive message
git commit -m "Add interactive map with Mapsi tiles and 12 clinic markers"

# Good commit message examples:
# "Add search bar with Mapsi geocoding autocomplete"
# "Implement nearest 3 clinics calculation using Haversine"
# "Add routing feature with turn-by-turn directions"
# "Fix mobile responsive layout for clinic cards"
```

---

### **Step 4: Push to Your Feature Branch**
```bash
# Push to GitHub (creates preview deployment)
git push origin week1

# Or if you're on a different branch, replace week1 with your branch name:
git push origin feature/map-display
```

---

### **Step 5: Create/Update Pull Request**

**First push of a new branch:**
1. Go to: `https://github.com/mahendranmahendran/magnetrock`
2. You'll see yellow banner: "week1 had recent pushes"
3. Click **"Compare & pull request"**
4. Add title and description
5. Click **"Create pull request"**

**Subsequent pushes to same branch (most common case):**

No extra steps needed on GitHub — just run the same three commands again:
```bash
git add .
git commit -m "Your description of what you changed"
git push origin week1
```
GitHub sees the push to the existing branch and automatically updates the open PR. The Vercel bot will post a new preview URL comment within ~2 minutes.

---

### **Step 6: Share Preview URL with Client**

1. Open the PR on GitHub
2. Wait ~2 minutes for Vercel to build
3. Look for **Vercel bot comment** with preview URL
4. Copy the URL (e.g., `magnetrock-git-foundation-xyz.vercel.app`)
5. Send to client: "Preview ready for review at [URL]"

---

### **Step 7: Wait for Client Approval**

**Client will:**
- Test the preview URL
- Review code changes on GitHub
- Leave comments if changes needed
- Merge when approved

**If client requests changes:**
- Make the changes in same branch
- Repeat Steps 1-4
- PR auto-updates with new changes

---

## **Complete Example Flow**

```bash
# 1. Make changes to files (edit code in VS Code or nano)

# 2. Check status
git status

# 3. Add changes
git add .

# 4. Commit
git commit -m "Add Leaflet map with Mapsi tiles"

# 5. Push
git push origin week1

# 6. Go to GitHub, create/check PR, copy preview URL

# 7. Message client: "Map feature ready at [preview-url]"

# 8. Wait for approval and merge
```

---

## **Quick Reference Card**

```bash
# Daily commands you'll use:
git status                          # What changed?
git add .                           # Stage all changes
git commit -m "Description"         # Save changes
git push origin <branch-name>       # Upload to GitHub

# When starting new feature:
git checkout main                   # Switch to main
git pull origin main                # Get latest
git checkout -b feature/new-thing   # New branch

# Check which branch you're on:
git branch                          # Shows * next to current
```

---

## **Common Mistakes to Avoid**

❌ **Don't commit without testing** - always check the code works first  
❌ **Don't use vague messages** - "fix stuff" → use "Fix mobile menu alignment"  
❌ **Don't push to `main`** - always push to feature branch  
❌ **Don't forget to push** - commit is local, push uploads to GitHub  

---

## **When to Create New Branch vs Continue Existing**

**Continue existing branch** (foundation, feature/map):
- You're iterating on the same feature
- Making fixes to PR feedback
- Not yet merged to main

**Create new branch:**
- Starting a completely different feature
- Previous branch was merged
- Working on Week 2 after Week 1 is done

Example:
```bash
# Week 1 Day 1-5: use 'foundation' branch
# After merge, start Week 2:
git checkout main
git pull origin main
git checkout -b week2-advanced-features
```

---

**Save this as a reference!** These are the only 4-5 commands you'll use 90% of the time.





You're currently on week1. Here are the commands to run  
  in order:                                  
                                                           
  # 1. Create the week2 branch from current state        
  git checkout -b week2                                    
   
  # 2. Stage all Week 2 changes                            
  git add app/booking/page.tsx \                         
          app/locations/page.tsx \                         
          components/ClinicMap.tsx \                       
          components/CoverageLayer.tsx \
          components/ClinicMiniMap.tsx \                   
          app/api/coverage/ \                            
          app/api/isochrone/ \
          app/api/matrix/ \
          data/coverage-zones.json \                       
          data/coverage-fees.json \
          docs/week2-code-summary.html \                   
          package.json \                                 
          package-lock.json
                                                           
  # 3. Commit
  git commit -m "Week 2: coverage zones, autocomplete,     
  coverage check, matrix API, mini-map"                    
   
  # 4. Push to remote                                      
  git push -u origin week2                               

  What each step does:
  - Step 1 — branches off week1 so the full project history
   is preserved                                            
  - Step 2 — stages only the Week 2 files (avoids
  accidentally picking up anything else)                   
  - Step 3 — single commit for the whole week (matching the
   Week 1 pattern from your git log)                       
  - Step 4 — -u origin week2 sets the upstream so future   
  git push works without arguments                       
                               
