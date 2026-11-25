import { TestBed } from '@angular/core/testing';
import { JobService } from './job.service';
import { SeedDataService } from './seed-data.service';

describe('Work Request & First-Come First-Served (FCFS) Grab System', () => {
  let jobService: JobService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [JobService, SeedDataService]
    });
    jobService = TestBed.inject(JobService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow customer to create an open work request for a plumber with unassigned workerId', () => {
    const newRequest = jobService.createJob({
      customerId: 'customer_tanvir_1',
      customerName: 'তানভীর আহমেদ',
      customerPhone: '01712345678',
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার (পাইপ ফিটিং)',
      description: 'জরুরি প্লাম্বার প্রয়োজন — বাথরুমে পানির পাইপ লিকেজ',
      estimatedPrice: 400,
      type: 'board_fixed',
      status: 'searching',
      workerId: null
    });

    expect(newRequest).toBeTruthy();
    expect(newRequest.id).toBeDefined();
    expect(newRequest.workerId).toBeNull();
    expect(newRequest.status).toBe('searching');
    expect(newRequest.categoryId).toBe('plumber');

    const openPlumberJobs = jobService.getOpenBoardJobs('plumber');
    const found = openPlumberJobs.find(j => j.id === newRequest.id);
    expect(found).toBeDefined();
  });

  it('should allow the first plumber to grab the work request and assign them as the serving worker', () => {
    const newRequest = jobService.createJob({
      customerId: 'customer_tanvir_1',
      customerName: 'তানভীর আহমেদ',
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার',
      description: 'কিচেনের সিঙ্কের কল নষ্ট',
      estimatedPrice: 350,
      type: 'board_fixed',
      status: 'searching',
      workerId: null
    });

    const plumber1 = {
      uid: 'worker_rahim_1',
      name: 'মো: রহিম উদ্দিন',
      phone: '01711223344',
      photoURL: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150'
    };

    const grabResult = jobService.grabJob(newRequest.id, plumber1);
    expect(grabResult.success).toBe(true);
    expect(grabResult.message).toContain('সফলভাবে');

    const updatedJob = jobService.getJobById(newRequest.id);
    expect(updatedJob?.workerId).toBe('worker_rahim_1');
    expect(updatedJob?.workerName).toBe('মো: রহিম উদ্দিন');
    expect(updatedJob?.status).toBe('accepted');
  });

  it('should reject a second plumber trying to grab the already grabbed job (First-Come, First-Served race safety)', () => {
    const newRequest = jobService.createJob({
      customerId: 'customer_tanvir_1',
      customerName: 'তানভীর আহমেদ',
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার',
      description: 'কমোড ফ্লাশ ট্যাংক মেরামত',
      estimatedPrice: 450,
      type: 'board_fixed',
      status: 'searching',
      workerId: null
    });

    const plumber1 = {
      uid: 'worker_rahim_1',
      name: 'মো: রহিম উদ্দিন',
      phone: '01711223344',
      photoURL: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150'
    };

    const plumber2 = {
      uid: 'worker_kalam_5',
      name: 'মো: কালাম হোসেন',
      phone: '01755667788',
      photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'
    };

    // Plumber 1 grabs first
    const firstGrab = jobService.grabJob(newRequest.id, plumber1);
    expect(firstGrab.success).toBe(true);

    // Plumber 2 tries to grab the same work
    const secondGrab = jobService.grabJob(newRequest.id, plumber2);
    expect(secondGrab.success).toBe(false);
    expect(secondGrab.message).toContain('ইতিমধ্যে অন্য একজন কারিগর');
    expect(secondGrab.message).toContain('মো: রহিম উদ্দিন');

    // Verify worker is still plumber 1
    const finalJob = jobService.getJobById(newRequest.id);
    expect(finalJob?.workerId).toBe('worker_rahim_1');

    // Verify job no longer appears in open board jobs
    const openJobs = jobService.getOpenBoardJobs('plumber');
    const stillOpen = openJobs.find(j => j.id === newRequest.id);
    expect(stillOpen).toBeUndefined();
  });

  it('should allow simulation of a plumber grab for live interactive testing', () => {
    const newRequest = jobService.createJob({
      customerId: 'customer_tanvir_1',
      customerName: 'তানভীর আহমেদ',
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার',
      description: 'পানির মোটর পাম্প চেক',
      estimatedPrice: 500,
      type: 'board_fixed',
      status: 'searching',
      workerId: null
    });

    const simResult = jobService.simulateWorkerGrab(newRequest.id, 'worker_kalam_5');
    expect(simResult.success).toBe(true);
    expect(simResult.workerName).toBe('মো: কালাম হোসেন');

    const updatedJob = jobService.getJobById(newRequest.id);
    expect(updatedJob?.workerId).toBe('worker_kalam_5');
    expect(updatedJob?.status).toBe('accepted');
  });

  it('requires valid startOtp to start work and valid completionOtp to finish work', () => {
    const job = jobService.createJob({
      customerId: 'user_customer_demo_1',
      customerName: 'তানভীর আহমেদ',
      categoryId: 'plumber',
      categoryName: 'প্লাম্বার',
      estimatedPrice: 400,
      type: 'instant',
      status: 'searching'
    });

    expect(job.startOtp).toMatch(/^\d{4}$/);
    expect(job.completionOtp).toMatch(/^\d{4}$/);

    jobService.grabJob(job.id, {
      uid: 'worker_rahim_1',
      name: 'মো: রহিম উদ্দিন',
      phone: '01711223344',
      photoURL: ''
    });

    const badStart = jobService.verifyAndStartJob(job.id, '0000');
    if (job.startOtp !== '0000') {
      expect(badStart.success).toBe(false);
    }

    const goodStart = jobService.verifyAndStartJob(job.id, job.startOtp);
    expect(goodStart.success).toBe(true);
    expect(jobService.getJobById(job.id)?.status).toBe('in_progress');

    const badFinish = jobService.verifyAndCompleteJob(job.id, '9999', 400, 0);
    if (job.completionOtp !== '9999') {
      expect(badFinish.success).toBe(false);
      expect(jobService.getJobById(job.id)?.status).toBe('in_progress');
    }

    const goodFinish = jobService.verifyAndCompleteJob(job.id, job.completionOtp!, 400, 50);
    expect(goodFinish.success).toBe(true);
    expect(jobService.getJobById(job.id)?.status).toBe('completed');
    expect(jobService.getJobById(job.id)?.finalPrice).toBe(400);
    expect(jobService.getJobById(job.id)?.materialCost).toBe(50);
  });
});
